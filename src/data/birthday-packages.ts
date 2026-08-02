import type { BirthdayPackage } from "@/types";

export const birthdayPackages: BirthdayPackage[] = [
  {
    id: "bday-kids-party",
    slug: "kids-birthday-party-box",
    audience: "kids",
    name: "Kids Birthday Party Box",
    description:
      "Themed party favours sized for the whole party — mini mystery eggs and trinkets, no small choking-hazard parts.",
    priceFrom: 3.5,
    includes: [
      "1 mini mystery egg per guest",
      "Themed stickers",
      "Optional party bag packaging",
      "Choose from any theme",
    ],
    ageRange: "4-12",
    themeIds: ["theme-unicorn-dreams", "theme-retro-cartoon", "theme-kawaii-pastels"],
    image: "/images/products/birthday-kids.svg",
  },
  {
    id: "bday-kids-milestone",
    slug: "kids-milestone-birthday-box",
    audience: "kids",
    name: "Kids Milestone Birthday Box",
    description: "A bigger single box for the birthday child — jewellery, stationery and a wheel spin voucher.",
    priceFrom: 18,
    includes: ["1 jewellery mystery box", "1 stationery mystery box", "1 wheel spin voucher"],
    ageRange: "5-12",
    themeIds: ["theme-unicorn-dreams", "theme-kawaii-pastels"],
    image: "/images/products/birthday-kids.svg",
  },
  {
    id: "bday-adult-hen",
    slug: "adult-party-hen-box",
    audience: "adult-party",
    name: "Adult Party / Hen Box",
    description:
      "Build-your-own party box — pick the mix of jewellery, beauty and cheeky extras for a hen do or girls' night.",
    priceFrom: 15,
    includes: ["Customisable box mix", "Optional luxury upgrade", "Personalised note"],
    themeIds: ["theme-y2k-sparkle", "theme-celestial-stars"],
    image: "/images/products/birthday-adult.svg",
  },
  {
    id: "bday-adult-milestone",
    slug: "adult-milestone-birthday-box",
    audience: "adult-party",
    name: "Adult Milestone Birthday Box",
    description: "A luxury edit for 18th, 21st, 30th and other milestone birthdays.",
    priceFrom: 25,
    includes: ["1 luxury jewellery or beauty box", "1 wheel spin", "Gift wrapping"],
    themeIds: ["theme-celestial-stars", "theme-cottagecore-florals"],
    image: "/images/products/birthday-adult.svg",
  },
];
