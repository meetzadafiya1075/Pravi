import base64
import io
import qrcode
from qrcode.image.svg import SvgPathImage


class QrService:
    @staticmethod
    def generate_asset_qr_base64(asset_id: str, asset_tag: str, base_url: str = "http://localhost:3000") -> str:
        scan_url = f"{base_url}/assets/scan?tag={asset_tag}&id={asset_id}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(scan_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
