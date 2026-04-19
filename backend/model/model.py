"""
WasteVision: Hybrid CNN-ViT Architecture for Waste Field Analysis
================================================================
Combines ResNet/EfficientNet backbone with Vision Transformer encoder.
Dual heads: multi-label classification + per-class regression.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from typing import Dict, Tuple, Optional, List
import math
import uvicorn
import socket
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import json
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Waste Categories ────────────────────────────────────────────────────────
WASTE_CLASSES = [
    "metal", "plastic", "organic", "e_waste",
    "glass", "paper", "textile", "hazardous"
]
NUM_CLASSES = len(WASTE_CLASSES)


# ─── Multi-Head Self-Attention (lightweight ViT encoder) ─────────────────────
class MultiHeadSelfAttention(nn.Module):
    def __init__(self, embed_dim: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert embed_dim % num_heads == 0
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.scale = self.head_dim ** -0.5

        self.qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.attn_drop = nn.Dropout(dropout)
        self.proj_drop = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, N, C = x.shape
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)

        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        attn = self.attn_drop(attn)

        x = (attn @ v).transpose(1, 2).reshape(B, N, C)
        x = self.proj(x)
        x = self.proj_drop(x)
        return x


# ─── Transformer Block ──────────────────────────────────────────────────────
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim: int, num_heads: int, mlp_ratio: float = 4.0, dropout: float = 0.1):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = MultiHeadSelfAttention(embed_dim, num_heads, dropout)
        self.norm2 = nn.LayerNorm(embed_dim)
        mlp_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_dim, embed_dim),
            nn.Dropout(dropout),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.norm1(x))
        x = x + self.mlp(self.norm2(x))
        return x


# ─── Patch Positional Encoding ──────────────────────────────────────────────
class PatchPositionalEncoding(nn.Module):
    def __init__(self, num_patches: int, embed_dim: int):
        super().__init__()
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B = x.shape[0]
        cls = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls, x], dim=1)
        x = x + self.pos_embed
        return x


# ─── ViT Encoder ────────────────────────────────────────────────────────────
class ViTEncoder(nn.Module):
    """
    Lightweight ViT that tokenizes CNN feature maps.
    Feature map (B, C, H, W) → patch tokens → transformer → [CLS] token.
    """
    def __init__(
        self,
        feature_dim: int,
        embed_dim: int = 256,
        num_heads: int = 4,
        num_layers: int = 2,
        patch_size: int = 1,
        dropout: float = 0.1,
        feature_map_size: int = 7,
    ):
        super().__init__()
        num_patches = feature_map_size * feature_map_size
        self.patch_proj = nn.Linear(feature_dim, embed_dim)
        self.pos_enc = PatchPositionalEncoding(num_patches, embed_dim)
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, dropout=dropout)
            for _ in range(num_layers)
        ])
        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, feat_map: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            feat_map: (B, C, H, W) CNN feature map
        Returns:
            cls_token: (B, embed_dim) global representation
            patch_tokens: (B, N, embed_dim) local tokens
        """
        B, C, H, W = feat_map.shape
        tokens = feat_map.flatten(2).transpose(1, 2)  # (B, H*W, C)
        tokens = self.patch_proj(tokens)               # (B, N, embed_dim)
        tokens = self.pos_enc(tokens)                   # (B, N+1, embed_dim)

        for block in self.blocks:
            tokens = block(tokens)

        tokens = self.norm(tokens)
        cls_token = tokens[:, 0]        # (B, embed_dim)
        patch_tokens = tokens[:, 1:]    # (B, N, embed_dim)
        return cls_token, patch_tokens


# ─── CNN Backbone ────────────────────────────────────────────────────────────
class CNNBackbone(nn.Module):
    def __init__(self, backbone: str = "resnet50", pretrained: bool = True):
        super().__init__()
        self.backbone_name = backbone

        if backbone == "resnet50":
            base = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2 if pretrained else None)
            self.features = nn.Sequential(*list(base.children())[:-2])
            self.out_channels = 2048
            self.out_spatial = 7
        elif backbone == "resnet34":
            base = models.resnet34(weights=models.ResNet34_Weights.IMAGENET1K_V1 if pretrained else None)
            self.features = nn.Sequential(*list(base.children())[:-2])
            self.out_channels = 512
            self.out_spatial = 7
        elif backbone == "efficientnet_b3":
            base = models.efficientnet_b3(weights=models.EfficientNet_B3_Weights.IMAGENET1K_V1 if pretrained else None)
            self.features = base.features
            self.out_channels = 1536
            self.out_spatial = 7
        elif backbone == "efficientnet_b0":
            base = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None)
            self.features = base.features
            self.out_channels = 1280
            self.out_spatial = 7
        else:
            raise ValueError(f"Unsupported backbone: {backbone}")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.features(x)


# ─── Classification Head ────────────────────────────────────────────────────
class ClassificationHead(nn.Module):
    def __init__(self, embed_dim: int, num_classes: int = NUM_CLASSES, dropout: float = 0.1):
        super().__init__()
        self.head = nn.Sequential(
            nn.LayerNorm(embed_dim),
            nn.Dropout(dropout),
            nn.Linear(embed_dim, embed_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(embed_dim, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(x)


# ─── Regression Head ────────────────────────────────────────────────────────
class RegressionHead(nn.Module):
    """
    Predicts per-class waste percentage.
    Applies softmax so outputs sum to 100%.
    Uses sigmoid-gated softmax for better gradient flow.
    """
    def __init__(self, embed_dim: int, num_classes: int = NUM_CLASSES, dropout: float = 0.1):
        super().__init__()
        self.head = nn.Sequential(
            nn.LayerNorm(embed_dim),
            nn.Dropout(dropout),
            nn.Linear(embed_dim, embed_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(embed_dim, num_classes),
        )

    def forward(self, x: torch.Tensor, class_logits: Optional[torch.Tensor] = None) -> torch.Tensor:
        raw = self.head(x)
        class_probs = torch.sigmoid(class_logits.detach()) if class_logits is not None else torch.sigmoid(raw)
        percentages = F.softmax(raw, dim=-1) * class_probs
        return percentages


# ─── Feature Fusion ─────────────────────────────────────────────────────────
class FeatureFusion(nn.Module):
    """Fuses CNN global pooled features with ViT CLS token via learned gating."""
    def __init__(self, cnn_dim: int, vit_dim: int, out_dim: int):
        super().__init__()
        self.cnn_proj = nn.Linear(cnn_dim, out_dim)
        self.vit_proj = nn.Linear(vit_dim, out_dim)
        self.gate = nn.Sequential(
            nn.Linear(out_dim * 2, out_dim),
            nn.Sigmoid(),
        )
        self.norm = nn.LayerNorm(out_dim)

    def forward(self, cnn_feat: torch.Tensor, vit_feat: torch.Tensor) -> torch.Tensor:
        f_cnn = self.cnn_proj(cnn_feat)
        f_vit = self.vit_proj(vit_feat)
        gate = self.gate(torch.cat([f_cnn, f_vit], dim=-1))
        fused = gate * f_cnn + (1 - gate) * f_vit
        return self.norm(fused)


# ─── WasteVision Model ──────────────────────────────────────────────────────
class WasteVisionModel(nn.Module):
    """
    Hybrid CNN + ViT model for multi-label waste classification
    and per-class percentage regression.

    Forward pass returns:
        {
            "class_logits": Tensor(B, C)      – raw logits for BCE loss
            "percentages":  Tensor(B, C)      – 0-100 percentage per class
        }
    """
    def __init__(
        self,
        backbone: str = "resnet50",
        pretrained: bool = True,
        num_classes: int = NUM_CLASSES,
        vit_embed_dim: int = 256,
        vit_num_heads: int = 4,
        vit_num_layers: int = 2,
        fusion_dim: int = 256,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.num_classes = num_classes
        self.class_names = WASTE_CLASSES

        self.backbone = CNNBackbone(backbone, pretrained)
        cnn_dim = self.backbone.out_channels
        spatial = self.backbone.out_spatial

        self.vit = ViTEncoder(
            feature_dim=cnn_dim,
            embed_dim=vit_embed_dim,
            num_heads=vit_num_heads,
            num_layers=vit_num_layers,
            feature_map_size=spatial,
            dropout=dropout,
        )

        self.gap = nn.AdaptiveAvgPool2d(1)
        self.fusion = FeatureFusion(cnn_dim, vit_embed_dim, fusion_dim)
        self.cls_head = ClassificationHead(fusion_dim, num_classes, dropout)
        self.reg_head = RegressionHead(fusion_dim, num_classes, dropout)
        self._init_heads()

    def _init_heads(self):
        for m in [self.cls_head, self.reg_head]:
            for layer in m.modules():
                if isinstance(layer, nn.Linear):
                    nn.init.trunc_normal_(layer.weight, std=0.02)
                    if layer.bias is not None:
                        nn.init.zeros_(layer.bias)

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        feat_map = self.backbone(x)
        cnn_global = self.gap(feat_map).flatten(1)
        vit_cls, _ = self.vit(feat_map)
        fused = self.fusion(cnn_global, vit_cls)

        class_logits = self.cls_head(fused)
        percentages = self.reg_head(fused, class_logits)

        return {
            "class_logits": class_logits,
            "percentages": percentages,
        }

    @torch.no_grad()
    def predict(self, x: torch.Tensor, cls_threshold: float = 0.5) -> List[Dict]:
        """
        Inference-mode forward: returns structured dicts.
        Args:
            x: (B, 3, H, W) image tensor
            cls_threshold: sigmoid threshold for class activation
        Returns:
            List of dicts per image:
            {
                "waste_types": ["metal", "plastic"],
                "percentages": {"metal": 40.2, "plastic": 35.1, ...}
            }
        """
        self.eval()
        out = self.forward(x)
        class_probs = torch.sigmoid(out["class_logits"])
        percentages = out["percentages"]

        results = []
        for i in range(x.shape[0]):
            active_mask = class_probs[i] > cls_threshold
            active_classes = []
            for j in range(self.num_classes):
                if active_mask[j]:
                    active_classes.append(self.class_names[j])

            pct_dict = {}
            for j, name in enumerate(self.class_names):
                pct_dict[name] = round(percentages[i][j].item() * 100, 1)

            # Normalize to 100%
            total = sum(pct_dict.values())
            if total > 0:
                pct_dict = {k: round(v / total * 100, 1) for k, v in pct_dict.items()}

            results.append({
                "waste_types": active_classes,
                "percentages": pct_dict,
            })
        return results

    def get_param_count(self):
        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return total, trainable


# ─── Model Builder Functions ────────────────────────────────────────────────
def build_lightweight_model(num_classes: int = NUM_CLASSES) -> WasteVisionModel:
    """
    EfficientNet-B0 + smaller ViT for edge/real-time deployment (~15M params).
    """
    return WasteVisionModel(
        backbone="efficientnet_b0",
        pretrained=True,
        num_classes=num_classes,
        vit_embed_dim=128,
        vit_num_heads=4,
        vit_num_layers=1,
        fusion_dim=128,
        dropout=0.1,
    )


def build_standard_model(num_classes: int = NUM_CLASSES) -> WasteVisionModel:
    """ResNet50 + ViT standard model (~50M params)."""
    return WasteVisionModel(
        backbone="resnet50",
        pretrained=True,
        num_classes=num_classes,
        vit_embed_dim=256,
        vit_num_heads=4,
        vit_num_layers=2,
        fusion_dim=256,
        dropout=0.1,
    )


def build_heavy_model(num_classes: int = NUM_CLASSES) -> WasteVisionModel:
    """EfficientNet-B3 + larger ViT for maximum accuracy."""
    return WasteVisionModel(
        backbone="efficientnet_b3",
        pretrained=True,
        num_classes=num_classes,
        vit_embed_dim=384,
        vit_num_heads=8,
        vit_num_layers=4,
        fusion_dim=384,
        dropout=0.15,
    )


# ─── Gemini AI Classification (Primary Analysis) ────────────────────────────

API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyAIP7qCggeqbJ8H1Q9GI53wPfNuqIXggq8"

try:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=API_KEY)
except ImportError:
    client = None

SYSTEM_PROMPT = """
    You are an AI system specialized in waste classification.
    Analyze the given image and identify if it is a garbage dump or contains garbage.
    
    CRITICAL: If the image is completely black, extremely blurry, or does not contain a discernible scene, return "is_garbage": false and message: "False Image / Invalid Source".

    Output EXACTLY in this strict JSON format and nothing else:
    {
        "is_garbage": true/false,
        "garbage_type": "plastic, metal, organic, e_waste, glass, paper, textile, hazardous, or 'none'",
        "confidence": 0.9,
        "accuracy": 0.99,
        "message": "Brief explanation or 'False Image' if invalid"
    }
    """


async def analyze_waste(image: UploadFile = File(...)):
    """Analyze uploaded image using Gemini 2.5 Flash for waste classification."""
    if not client:
        return {"error": "API Client could not be initialized."}

    contents = await image.read()
    img = Image.open(io.BytesIO(contents))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[SYSTEM_PROMPT, img],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        return {"error": str(e)}


# Also expose a sync version for the service layer
def analyze_image(image_bytes: bytes) -> dict:
    """Synchronous wrapper for use by app/service.py."""
    if not client:
        raise RuntimeError("Gemini API client not initialized — google-genai not installed")

    img = Image.open(io.BytesIO(image_bytes))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[SYSTEM_PROMPT, img],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        return {"error": str(e)}


# ─── Standalone Server Mode ─────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    import socket
    import sys

    # --- NGROK SETUP ---
    NGROK_TOKEN = "your_ngrok_authtoken_here"  # Paste your Ngrok token here!

    if NGROK_TOKEN != "your_ngrok_authtoken_here":
        try:
            from pyngrok import ngrok
            ngrok.set_auth_token(NGROK_TOKEN)
            public_url = ngrok.connect(8000).public_url
            print("\n" + "=" * 70)
            print("[PUBLIC API IS LIVE! NGROK CONNECTED]")
            print("=" * 70)
            print("Tell Laptop A (Frontend) and ANY device on the internet to connect to:")
            print(f"-->  {public_url}/api/analyze-waste")
            print("=" * 70 + "\n")
        except Exception as e:
            print(f"\n[ERROR] Ngrok failed: {e}\n")
    else:
        def get_local_ip():
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                s.connect(('10.255.255.255', 1))
                IP = s.getsockname()[0]
            except Exception:
                IP = '127.0.0.1'
            finally:
                s.close()
            return IP

        local_ip = get_local_ip()

        print("\n" + "=" * 70)
        print("[LOCAL WIFI API IS READY!] (To make it public, add NGROK_TOKEN in code)")
        print("=" * 70)
        print("Tell Laptop A (Frontend) on the SAME WIFI to connect to:")
        print(f"-->  http://{local_ip}:8000/api/analyze-waste")
        print("=" * 70 + "\n")

    uvicorn.run("model1:app", host="0.0.0.0", port=8000, reload=False)

# ─── FastAPI Web Server Definition ──────────────────────────────────────────
else:
    app = FastAPI(title="WasteVision API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

import torchvision.transforms as T


@app.post("/api/analyze-waste")
async def analyze_waste_endpoint(image: UploadFile = File(...)):
    """Primary endpoint: uses Gemini 2.5 Flash for waste classification."""
    return await analyze_waste(image)
