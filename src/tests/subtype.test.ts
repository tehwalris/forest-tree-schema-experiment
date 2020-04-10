import { GrammarType, Grammar, TypeContext } from "../index";
import { emptyGrammar } from "../example-grammars";

describe("isSubtype", () => {
  interface Case {
    label: string;
    a: GrammarType;
    b: GrammarType;
    grammar: Grammar;
    isSubtype: [boolean, boolean]; // [isSubtype(a, b), isSubtype(b, a)]
  }

  const cases: Case[] = [
    {
      label: "primitive.Leaf is subtype of itself",
      a: "primitive.Leaf",
      b: "primitive.Leaf",
      grammar: emptyGrammar,
      isSubtype: [true, true],
    },
    {
      label: "different primitives are not subtypes",
      a: "primitive.Leaf",
      b: "primitive.Hole",
      grammar: emptyGrammar,
      isSubtype: [false, false],
    },
    {
      label: "primitives without parameters are subtypes of themselves",
      a: { type: "primitive.Leaf", parameters: [] },
      b: { type: "primitive.Leaf", parameters: [] },
      grammar: emptyGrammar,
      isSubtype: [true, true],
    },
    {
      label:
        "primitives without parameters are subtypes of their string version",
      a: "primitive.Leaf",
      b: { type: "primitive.Leaf", parameters: [] },
      grammar: emptyGrammar,
      isSubtype: [true, true],
    },
    // TODO This list subtyping only makes sense for read-only lists. Is that what we want?
    {
      label: "lists with same parameter are subtypes",
      a: { type: "primitive.List", parameters: ["primitive.Leaf"] },
      b: { type: "primitive.List", parameters: ["primitive.Leaf"] },
      grammar: emptyGrammar,
      isSubtype: [true, true],
    },
    {
      label: "lists with subtype parameters are subtypes",
      a: { type: "primitive.List", parameters: ["primitive.Leaf"] },
      b: {
        type: "primitive.List",
        parameters: [{ type: "primitive.Leaf", parameters: [] }],
      },
      grammar: emptyGrammar,
      isSubtype: [true, true],
    },
    {
      label: "lists with non-subtype parameters are not subtypes",
      a: { type: "primitive.List", parameters: ["primitive.Leaf"] },
      b: { type: "primitive.List", parameters: ["primitive.Hole"] },
      grammar: emptyGrammar,
      isSubtype: [false, false],
    },
  ];

  for (const c of cases) {
    test(c.label, () => {
      const context = new TypeContext(c.grammar);
      expect(context.isSubtype(c.a, c.b)).toEqual(c.isSubtype[0]);
      expect(context.isSubtype(c.b, c.a)).toEqual(c.isSubtype[1]);
    });
  }
});
