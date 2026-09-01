import Image from 'next/image';

/**
 * شعار المكتب الرسمي.
 *
 * الملف بخلفية بيضاء بلا شفافية، فيُعرض داخل حاوية بيضاء حتى يبقى مقروءاً
 * على الخلفيات الداكنة ولا يظهر كمربع أبيض ناشز.
 */
export function OfficeLogo({
  size = 48,
  className = '',
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-white rounded-xl shadow-sm overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size, padding: Math.round(size * 0.08) }}
    >
      <Image
        src="/brand/marib-tax-logo.png"
        alt="شعار مكتب الضرائب بمحافظة مأرب"
        width={size}
        height={size}
        priority={priority}
        className="object-contain w-full h-full"
      />
    </span>
  );
}
