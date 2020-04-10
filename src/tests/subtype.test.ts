import { GrammarType, isSubtype } from "../index";

describe("isSubtype", () => {
  interface Case {
    label: string;
    a: GrammarType;
    b: GrammarType;
    isSubtype: boolean;
  }

  const cases: Case[] = [
    {
      label: "primitive.Leaf is subtype of itself",
      a: "primitive.Leaf",
      b: "primitive.Leaf",
      isSubtype: true,
    },
  ];

  for (const c of cases) {
    test(c.label, () => {
      expect(isSubtype(c.a, c.b)).toEqual(true);
    });
  }
});
