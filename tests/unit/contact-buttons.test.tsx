import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ContactButtons } from "@/components/contact-buttons";
import type { SiteSettings } from "@/lib/types";
import { instagramUrl, whatsappLink } from "@/lib/whatsapp";

const settings: SiteSettings = {
  whatsapp_number: "905321234567",
  instagram_username: "rose.patisserie.tr",
  tagline: "",
  about_text: "",
};

describe("ContactButtons", () => {
  test("WhatsApp bağlantısı ürün adlı mesajı taşır ve yeni sekmede açılır", () => {
    render(
      <ContactButtons settings={settings} productTitle="Frambuazlı Cheesecake" productUrl="https://site.test/urun/x" />,
    );
    const link = screen.getByRole("link", { name: /WhatsApp'tan yaz/ });
    expect(link).toHaveAttribute(
      "href",
      whatsappLink("905321234567", "Frambuazlı Cheesecake", "https://site.test/urun/x"),
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  test("ürün adı yoksa genel mesaj gönderilir", () => {
    render(<ContactButtons settings={settings} />);
    const href = screen.getByRole("link", { name: /WhatsApp'tan yaz/ }).getAttribute("href")!;
    expect(href).toBe(whatsappLink("905321234567"));
    expect(decodeURIComponent(href.split("text=")[1])).toBe("Merhaba, bilgi almak istiyorum.");
  });

  test("Instagram bağlantısı profile gider", () => {
    render(<ContactButtons settings={settings} />);
    const link = screen.getByRole("link", { name: /Instagram/ });
    expect(link).toHaveAttribute("href", instagramUrl("rose.patisserie.tr"));
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  test("WhatsApp numarası yoksa WhatsApp butonu görünmez", () => {
    render(<ContactButtons settings={{ ...settings, whatsapp_number: null }} />);
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Instagram/ })).toBeInTheDocument();
  });

  test("Instagram kullanıcı adı yoksa Instagram butonu görünmez", () => {
    render(<ContactButtons settings={{ ...settings, instagram_username: null }} />);
    expect(screen.queryByRole("link", { name: /Instagram/ })).toBeNull();
    expect(screen.getByRole("link", { name: /WhatsApp'tan yaz/ })).toBeInTheDocument();
  });

  test("ikisi de boşsa hiçbir şey render edilmez", () => {
    const { container } = render(
      <ContactButtons settings={{ ...settings, whatsapp_number: null, instagram_username: "" }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
