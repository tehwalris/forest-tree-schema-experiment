import { Grammar, UnknownTreeNode, TypeContext } from "..";
import { emptyGrammar, langGrammar } from "../example-grammars";

describe("TypeContext.isTypeValid", () => {
  interface Case {
    label: string;
    tree: UnknownTreeNode;
    grammar: Grammar;
    valid: boolean;
  }
  const cases: Case[] = [
    {
      label: "primitive tree with single node (valid type)",
      tree: {
        type: "primitive.String",
        value: {
          type: "primitive.String",
          value: "walrus",
        },
      },
      grammar: emptyGrammar,
      valid: true,
    },
    {
      label: "primitive tree with single node (value does not match type)",
      tree: {
        type: "primitive.List",
        value: {
          type: "primitive.String",
          value: "walrus",
        },
      },
      grammar: emptyGrammar,
      valid: false,
    },
    {
      label: "primitive.Nothing",
      tree: {
        type: "primitive.Nothing",
        value: {
          type: "primitive.Leaf",
        },
      },
      grammar: emptyGrammar,
      valid: true,
    },
    {
      label: "list with valid items (only primitives)",
      tree: {
        type: {
          type: "primitive.List",
          parameters: ["primitive.Leaf"],
        },
        value: {
          type: "primitive.List",
          items: [
            {
              type: "primitive.Leaf",
              value: { type: "primitive.Leaf" },
            },
            {
              type: "primitive.Leaf",
              value: { type: "primitive.Leaf" },
            },
          ],
        },
      },
      grammar: emptyGrammar,
      valid: true,
    },
    {
      label: "list with item of wrong type (only primitives)",
      tree: {
        type: {
          type: "primitive.List",
          parameters: ["primitive.Leaf"],
        },
        value: {
          type: "primitive.List",
          items: [
            {
              type: "primitive.Leaf",
              value: { type: "primitive.Leaf" },
            },
            {
              type: "primitive.String",
              value: { type: "primitive.String", value: "walrus" },
            },
          ],
        },
      },
      grammar: emptyGrammar,
      valid: false,
    },
    {
      label: "list with item with invalid type (only primitives)",
      tree: {
        type: {
          type: "primitive.List",
          parameters: ["primitive.Leaf"],
        },
        value: {
          type: "primitive.List",
          items: [
            {
              type: "primitive.Leaf",
              value: { type: "primitive.Leaf" },
            },
            {
              type: "primitive.Leaf",
              value: { type: "primitive.String", value: "walrus" },
            },
          ],
        },
      },
      grammar: emptyGrammar,
      valid: false,
    },
    {
      label: "list with valid items (not primitive)",
      tree: {
        type: {
          type: "primitive.List",
          parameters: ["lang.Expression"],
        },
        value: {
          type: "primitive.List",
          items: [
            {
              type: "lang.BooleanLiteralTrue",
              value: { type: "primitive.Leaf" },
            },
            {
              type: "lang.BooleanLiteralFalse",
              value: { type: "primitive.Leaf" },
            },
            {
              type: "lang.BooleanLiteralFalse",
              value: { type: "primitive.Leaf" },
            },
          ],
        },
      },
      grammar: langGrammar,
      valid: true,
    },
    {
      label: "type which is structurally a list",
      tree: {
        type: "lang.Program",
        value: {
          type: "primitive.List",
          items: [],
        },
      },
      grammar: langGrammar,
      valid: true,
    },
    {
      label: "empty keyed type",
      tree: {
        type: {
          type: "primitive.Keyed",
          parameters: {},
        },
        value: {
          type: "primitive.Keyed",
          items: {},
        },
      },
      grammar: emptyGrammar,
      valid: true,
    },
    {
      label: "valid (non-empty) keyed type",
      tree: {
        type: {
          type: "primitive.Keyed",
          parameters: {
            a: "primitive.Leaf",
            b: "primitive.Nothing",
          },
        },
        value: {
          type: "primitive.Keyed",
          items: {
            a: {
              type: "primitive.Nothing",
              value: { type: "primitive.Leaf" },
            },
            b: {
              type: "primitive.Nothing",
              value: { type: "primitive.Leaf" },
            },
          },
        },
      },
      grammar: emptyGrammar,
      valid: true,
    },
    {
      label: "invalid keyed type (same keys but wrong types)",
      tree: {
        type: {
          type: "primitive.Keyed",
          parameters: {
            a: "primitive.Leaf",
            b: "primitive.Nothing",
          },
        },
        value: {
          type: "primitive.Keyed",
          items: {
            a: {
              type: "primitive.Leaf",
              value: { type: "primitive.Leaf" },
            },
            b: {
              type: "primitive.Leaf",
              value: { type: "primitive.Leaf" },
            },
          },
        },
      },
      grammar: emptyGrammar,
      valid: false,
    },
    {
      label: "invalid keyed type (different keys)",
      tree: {
        type: {
          type: "primitive.Keyed",
          parameters: {
            a: "primitive.Leaf",
            c: "primitive.Nothing",
          },
        },
        value: {
          type: "primitive.Keyed",
          items: {
            a: {
              type: "primitive.Nothing",
              value: { type: "primitive.Leaf" },
            },
            b: {
              type: "primitive.Nothing",
              value: { type: "primitive.Leaf" },
            },
          },
        },
      },
      grammar: emptyGrammar,
      valid: false,
    },
    {
      label: "valid keyed type (non-primitive)",
      tree: {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: "lang.BooleanLiteralTrue",
              value: {
                type: "primitive.Leaf",
              },
            },
          },
        },
      },
      grammar: langGrammar,
      valid: true,
    },
    {
      label: "invalid keyed type (child has wrong type)",
      tree: {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: "primitive.Leaf",
              value: {
                type: "primitive.Leaf",
              },
            },
          },
        },
      },
      grammar: langGrammar,
      valid: false,
    },
    {
      label: "invalid keyed type (child is invalid)",
      tree: {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: "lang.BooleanLiteralTrue",
              value: {
                type: "primitive.String",
                value: "walrus",
              },
            },
          },
        },
      },
      grammar: langGrammar,
      valid: false,
    },
    {
      label: "trees with correctly typed holes are valid",
      tree: {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: {
                type: "primitive.Hole",
                parameters: ["lang.BooleanLiteral"],
              },
              value: {
                type: "primitive.Hole",
              },
            },
          },
        },
      },
      grammar: langGrammar,
      valid: true,
    },
    {
      label: "trees with incorrectly typed holes are invalid",
      tree: {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: {
                type: "primitive.Hole",
                parameters: ["lang.Statement"],
              },
              value: {
                type: "primitive.Hole",
              },
            },
          },
        },
      },
      grammar: langGrammar,
      valid: false,
    },
    {
      label: "trees with holes with invalid content are invalid",
      tree: {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: {
                type: "primitive.Hole",
                parameters: ["lang.BooleanLiteral"],
              },
              value: {
                type: "primitive.Hole",
                value: {
                  type: "primitive.Leaf",
                  value: {
                    type: "primitive.String",
                    value: "walrus",
                  },
                },
              },
            },
          },
        },
      },
      grammar: langGrammar,
      valid: false,
    },
    {
      label: "trees with holes with valid but non-matching content are valid",
      tree: {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: {
                type: "primitive.Hole",
                parameters: ["lang.FunctionCall"],
              },
              value: {
                type: "primitive.Hole",
                value: {
                  type: "primitive.Leaf",
                  value: { type: "primitive.Leaf" },
                },
              },
            },
          },
        },
      },
      grammar: langGrammar,
      valid: true,
    },
  ];
  for (const c of cases) {
    test(c.label, () => {
      const context = new TypeContext(c.grammar);
      expect(context.isTypeValid(c.tree)).toEqual(c.valid);
    });
  }
});
