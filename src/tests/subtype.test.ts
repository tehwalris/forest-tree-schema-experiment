import { GrammarType, Grammar, TypeContext } from "../index";
import { emptyGrammar, langGrammar } from "../example-grammars";

describe("TypeContext.isSubtype", () => {
  interface Case {
    label: string;
    a: GrammarType;
    b: GrammarType;
    grammar: Grammar;
    isSubtype?: [boolean, boolean]; // [isSubtype(a, b), isSubtype(b, a)]
    error?: RegExp;
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
    {
      label: "throws on unknown type (in parameter)",
      a: { type: "primitive.List", parameters: ["something.Test"] },
      b: { type: "primitive.List", parameters: ["primitive.Hole"] },
      grammar: emptyGrammar,
      error: /\bsomething\.Test\b/,
    },
    {
      label: "throws on unknown type (in base of type)",
      a: { type: "primitive.Bla", parameters: ["lang.BooleanLiteralTrue"] },
      b: { type: "primitive.Bla", parameters: ["lang.Expression"] },
      grammar: langGrammar,
      error: /\bprimitive\.Bla\b/,
    },
    {
      label: "works with known non-primitive types (strict subtype)",
      a: "lang.IfStatement",
      b: "lang.Statement",
      grammar: langGrammar,
      isSubtype: [true, false],
    },
    {
      label: "works with known non-primitive types (equal)",
      a: "lang.IfStatement",
      b: "lang.IfStatement",
      grammar: langGrammar,
      isSubtype: [true, true],
    },
    {
      label: "works with known non-primitive types (not subtypes)",
      a: "lang.IfStatement",
      b: "lang.BooleanLiteral",
      grammar: langGrammar,
      isSubtype: [false, false],
    },
    {
      label: "works with known non-primitive types (deep)",
      a: "lang.BooleanLiteralTrue",
      b: "lang.Expression",
      grammar: langGrammar,
      isSubtype: [true, false],
    },
    {
      label: "non-primitive types work as parameters",
      a: { type: "primitive.List", parameters: ["lang.BooleanLiteralTrue"] },
      b: { type: "primitive.List", parameters: ["lang.Expression"] },
      grammar: langGrammar,
      isSubtype: [true, false],
    },
    {
      label: "supports primitive.Nothing",
      a: "primitive.Nothing",
      b: "primitive.Leaf",
      grammar: langGrammar,
      isSubtype: [true, false],
    },
    {
      label: "named types are subtypes of their anonymous versions",
      a: "lang.Program",
      b: { type: "primitive.List", parameters: ["lang.Statement"] },
      grammar: langGrammar,
      isSubtype: [true, false],
    },
    // TODO Support named union types (as subtypes of their anonymous merged versions)
  ];

  for (const c of cases) {
    test(c.label, () => {
      const context = new TypeContext(c.grammar);
      if (c.error) {
        expect(() => context.isSubtype(c.a, c.b)).toThrowError(c.error);
        expect(() => context.isSubtype(c.b, c.a)).toThrowError(c.error);
      } else if (c.isSubtype) {
        expect(context.isSubtype(c.a, c.b)).toEqual(c.isSubtype[0]);
        expect(context.isSubtype(c.b, c.a)).toEqual(c.isSubtype[1]);
      } else {
        throw new Error("either c.isSubtype or c.error must be defined");
      }
    });
  }
});
