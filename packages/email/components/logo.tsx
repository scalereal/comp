import { Img, Section } from '@react-email/components';

export function Logo() {
  const logoUrl =
    process.env.EMAIL_LOGO_URL ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')}/logo.png`
      : 'https://app.comp.scalereal.tech/logo.png');

  return (
    <Section className="mt-[32px]">
      <Img
        src={logoUrl}
        width="45"
        height="45"
        alt="Comp AI"
        className="mx-auto my-0 block"
      />
    </Section>
  );
}
