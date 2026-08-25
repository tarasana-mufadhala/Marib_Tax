"""
ضغط مستندات المصلحة المنقولة من الموقع القديم.

معظمها مسوحات ضوئية بدقة أعلى مما يلزم للقراءة على الشاشة، فحجمها يصل إلى
50 ميغابايت. على سرعات الإنترنت في اليمن هذا يعني أن المكلف لا يستطيع فتح
المستند أصلاً — فالضغط هنا ليس تحسيناً تقنياً بل شرط أن تكون المكتبة مفيدة.

الأصل يبقى كما هو في downloads/، والمضغوط يُكتب إلى downloads-compressed/.

التشغيل من جذر المستودع:
    python scripts/compress-legacy-documents.py
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "downloads" / "tax_gov_ye_documents"
TARGET = ROOT / "downloads" / "tax_gov_ye_documents_compressed"

# ما دون هذا لا يستحق إعادة الترميز.
COMPRESS_ABOVE_BYTES = 2 * 1024 * 1024
# عرض أقصى للصورة الممسوحة: يكفي للقراءة والطباعة العادية.
MAX_IMAGE_WIDTH = 1700
JPEG_QUALITY = 72


def compress(source: Path, target: Path) -> tuple[int, int]:
    """يعيد (الحجم قبل، الحجم بعد)."""
    original_size = source.stat().st_size
    document = fitz.open(source)

    for page_index in range(document.page_count):
        for image in document[page_index].get_images(full=True):
            xref = image[0]
            try:
                info = document.extract_image(xref)
            except Exception:
                continue

            pixmap = fitz.Pixmap(document, xref)
            # الصور ذات قناة الشفافية أو الفضاءات الخاصة تُترك كما هي:
            # إعادة ترميزها قد تُفسد ظهورها.
            if pixmap.n - pixmap.alpha >= 4 or pixmap.alpha:
                pixmap = None
                continue

            if pixmap.width <= MAX_IMAGE_WIDTH and info.get("ext") == "jpeg":
                pixmap = None
                continue

            if pixmap.width > MAX_IMAGE_WIDTH:
                scale = MAX_IMAGE_WIDTH / pixmap.width
                pixmap = fitz.Pixmap(
                    pixmap, int(pixmap.width * scale), int(pixmap.height * scale), None
                ) if hasattr(fitz.Pixmap, "__call__") else pixmap

            buffer = io.BytesIO()
            buffer.write(pixmap.tobytes("jpeg", jpg_quality=JPEG_QUALITY))
            try:
                document.update_stream(xref, buffer.getvalue(), new=True)
            except Exception:
                pass
            pixmap = None

    target.parent.mkdir(parents=True, exist_ok=True)
    document.save(
        target,
        garbage=4,        # يُزيل الكائنات غير المرجعية
        deflate=True,     # يضغط التدفقات
        deflate_images=True,
        deflate_fonts=True,
        clean=True,
    )
    document.close()
    return original_size, target.stat().st_size


def main() -> int:
    if not SOURCE.exists():
        print(f"مجلد المصدر غير موجود: {SOURCE}")
        return 1

    TARGET.mkdir(parents=True, exist_ok=True)
    files = sorted(SOURCE.glob("*.pdf"))
    total_before = 0
    total_after = 0
    compressed = 0
    copied = 0

    for source in files:
        target = TARGET / source.name
        size = source.stat().st_size

        if size <= COMPRESS_ABOVE_BYTES:
            target.write_bytes(source.read_bytes())
            total_before += size
            total_after += size
            copied += 1
            continue

        try:
            before, after = compress(source, target)
        except Exception as error:  # noqa: BLE001
            # الفشل لا يُسقط المستند: نَنسخ الأصل ونُكمل.
            target.write_bytes(source.read_bytes())
            total_before += size
            total_after += size
            copied += 1
            print(f"  ! {source.name}: تعذّر الضغط ({error}) — نُسخ كما هو")
            continue

        # لو كبُر بعد المعالجة نُبقي الأصل.
        if after >= before:
            target.write_bytes(source.read_bytes())
            after = before
            copied += 1
        else:
            compressed += 1
            print(
                f"  {source.name}: {before / 1048576:.1f}MB "
                f"-> {after / 1048576:.1f}MB "
                f"({100 - after * 100 // before}% أقل)"
            )

        total_before += before
        total_after += after

    print(
        f"\nضُغط {compressed}، نُسخ كما هو {copied}.\n"
        f"الإجمالي: {total_before / 1048576:.0f}MB -> {total_after / 1048576:.0f}MB"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
