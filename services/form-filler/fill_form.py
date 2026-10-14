"""
محرك تعبئة النماذج: يكتب قيم المستخدم فوق ملف النموذج الأصلي ويُخرج PDF
مطابقاً للأصل تماماً مع البيانات مكتوبة في مواضعها.

لماذا Python وليس Node مثل بقية الخادم؟
    نماذج المصلحة عربية، وكتابة العربية في PDF تتطلب وصل الحروف (shaping)
    وترتيب الكتابة من اليمين. جُرّبت مكتبات Node (pdf-lib مع fontkit
    ومُشكِّل عربي) فأنتجت حروفاً منفصلة ومبعثرة، ومع بعض الخطوط صفحة
    فارغة. PyMuPDF يمر عبر محرّك التنضيد في MuPDF فيتولّى ذلك بنفسه
    ويُخرج نصاً صحيحاً — فكان اختياره قراراً تقنياً لا تفضيلاً.

الاستدعاء:
    python fill_form.py <ملف الإدخال JSON>

بنية ملف الإدخال:
    {
      "templatePath": "مسار النموذج الأصلي",
      "outputPath":   "مسار الناتج",
      "fontPath":     "مسار خط عربي (اختياري)",
      "values":       { "field_code": "القيمة" },
      "fields": [
        {"code":"trade_name","page":0,"x":300,"y":95,"width":260,"height":22,
         "fontSize":12,"align":"right","type":"text"}
      ]
    }

يُخرج على stdout سطر JSON واحد: {"ok":true,"pages":n,"filled":m}
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pymupdf

DEFAULT_FONT = Path(__file__).resolve().parents[2] / "assets" / "fonts" / "Amiri-Regular.ttf"
FONT_FAMILY = "formfont"


def escape(text: str) -> str:
    """يمنع أن تُفسَّر قيمة المستخدم كترميز HTML."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def fill(spec: dict) -> dict:
    template = Path(spec["templatePath"])
    output = Path(spec["outputPath"])
    values: dict = spec.get("values") or {}
    fields: list = spec.get("fields") or []
    font_path = Path(spec.get("fontPath") or DEFAULT_FONT)

    if not template.exists():
        raise FileNotFoundError(f"النموذج غير موجود: {template}")
    if not font_path.exists():
        raise FileNotFoundError(f"الخط غير موجود: {font_path}")

    document = pymupdf.open(template)
    archive = pymupdf.Archive()
    archive.add(str(font_path), font_path.name)
    css = f"@font-face {{font-family: {FONT_FAMILY}; src: url({font_path.name});}}"

    filled = 0
    overflowed: list[str] = []

    for field in fields:
        code = field.get("code")
        raw = values.get(code)
        if raw is None or str(raw).strip() == "":
            continue

        page_index = int(field.get("page", 0))
        if page_index < 0 or page_index >= document.page_count:
            continue
        page = document[page_index]

        field_type = field.get("type", "text")
        text = "✓" if field_type == "checkbox" else str(raw).strip()
        if field_type == "checkbox" and str(raw).strip().lower() in {"false", "0", "لا", ""}:
            continue

        rect = pymupdf.Rect(
            float(field["x"]),
            float(field["y"]),
            float(field["x"]) + float(field.get("width", 200)),
            float(field["y"]) + float(field.get("height", 20)),
        )

        align = field.get("align", "right")
        size = float(field.get("fontSize", 11))
        color = field.get("color", "#000000")

        html = (
            f'<div style="font-family:{FONT_FAMILY};font-size:{size}px;'
            f'color:{color};text-align:{align};line-height:1.25;">'
            f"{escape(text)}</div>"
        )

        # القيمة السالبة تعني أن النص لم يتّسع في الصندوق المحدَّد.
        spare, _scale = page.insert_htmlbox(rect, html, css=css, archive=archive)
        if spare < 0:
            overflowed.append(code)
        filled += 1

    output.parent.mkdir(parents=True, exist_ok=True)
    # incremental=False: الناتج ملف مستقل لا يحمل تاريخ تعديلات النموذج.
    document.save(output, garbage=3, deflate=True)
    pages = document.page_count
    document.close()

    return {"ok": True, "pages": pages, "filled": filled, "overflowed": overflowed}


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "ينقص ملف الإدخال"}, ensure_ascii=False))
        return 1

    try:
        spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
        result = fill(spec)
    except Exception as error:  # noqa: BLE001
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 1

    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
