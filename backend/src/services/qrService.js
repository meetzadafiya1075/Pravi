const QRCode = require("qrcode");

class QrService {
  static async generateAssetQrBase64(assetId, assetTag) {
    const payload = JSON.stringify({
      id: assetId,
      tag: assetTag,
      type: "GOV_INFRA_ASSET",
      timestamp: new Date().toISOString(),
    });

    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: {
        dark: "#1C1917",
        light: "#FFFFFF",
      },
    });

    return dataUrl;
  }
}

module.exports = QrService;
