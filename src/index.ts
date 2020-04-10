interface GrammarTypeWithParameters {
  type: string;
  parameters: { [key: string]: GrammarType } | GrammarType[];
}

export type GrammarType = string | GrammarTypeWithParameters;

export interface Grammar {
  name: string;
  unions: { [key: string]: string[] };
  types: { [key: string]: GrammarTypeWithParameters };
}

interface Lens<C extends UnknownTreeNode, A extends UnknownTreeNode> {
  concrete: string;
  abstract: string;
  get: (concrete: C) => A | undefined;
  put: (concrete: C, abstract: A) => C | undefined;
}

interface Transform {
  name: string;
  trigger: "automatic";
  lens: Lens<UnknownTreeNode, UnknownTreeNode>;
}

const expressionsAsStatementsTransform: Transform = {
  name: "expressionsAsStatements",
  trigger: "automatic",
  lens: {
    concrete: "lang.ExpressionStatement",
    abstract: "lang.Expression",
    get: (concrete) => {
      if (!isPrimitive("primitive.Keyed", concrete.value)) {
        return undefined;
      }
      return concrete.value.items.expression;
    },
    put: (concrete, abstract) => ({
      type: "lang.ExpressionStatement",
      value: {
        type: "primitive.Keyed",
        items: {
          expression: abstract,
        },
      },
    }),
  },
};

interface TreeNode<V extends TreeNodeValue> {
  type: GrammarType;
  value: V;
}

type UnknownTreeNode = TreeNode<TreeNodeValue>;

type TreeNodeValue =
  | PrimitiveTreeNodeValue
  | ListTreeNodeValue
  | LeafTreeNodeValue
  | StringTreeNodeValue
  | HoleTreeNodeValue;

interface PrimitiveTreeNodeValue {
  type: "primitive.Keyed";
  items: { [key: string]: UnknownTreeNode | undefined };
}

interface ListTreeNodeValue {
  type: "primitive.List";
  items: UnknownTreeNode[];
}

interface LeafTreeNodeValue {
  type: "primitive.Leaf";
}

interface StringTreeNodeValue {
  type: "primitive.String";
  value: string;
}

interface HoleTreeNodeValue {
  type: "primitive.Hole";
  value: UnknownTreeNode | undefined;
}

function isPrimitive<T extends TreeNodeValue["type"]>(
  type: T,
  value: TreeNodeValue,
): value is TreeNodeValue & { type: T } {
  return value.type === type;
}

const exampleTree: UnknownTreeNode = {
  type: "lang.Program",
  value: {
    type: "primitive.List",
    items: [
      {
        type: "lang.ExpressionStatement",
        value: {
          type: "primitive.Keyed",
          items: {
            expression: {
              type: "lang.FunctionCall",
              value: {
                type: "primitive.Keyed",
                items: {
                  function: {
                    type: "lang.Identifier",
                    value: {
                      type: "primitive.String",
                      value: "assert",
                    },
                  },
                  parameters: {
                    type: {
                      type: "primitive.List",
                      parameters: ["lang.Expression"],
                    },
                    value: {
                      type: "primitive.List",
                      items: [
                        {
                          type: "lang.BoolLiteralTrue",
                          value: { type: "primitive.Leaf" },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

export class TypeContext {
  private knownTypeNames: Set<string>;
  private supertypesBySubtype = new Map<string, string>();

  constructor(private grammar: Grammar) {
    this.knownTypeNames = new Set([
      "primitive.Hole",
      "primitive.Keyed",
      "primitive.List",
      "primitive.Leaf",
      "primitive.String",
      "primitive.Hole",
    ]);
    const toNamespaced = (typeName: string) => `${grammar.name}.${typeName}`;
    for (const type of [
      ...Object.keys(grammar.unions),
      ...Object.keys(grammar.types),
    ]) {
      this.knownTypeNames.add(toNamespaced(type));
    }
    for (const [supertype, subtypes] of Object.entries(grammar.unions)) {
      for (const subtype of subtypes) {
        if (this.supertypesBySubtype.has(toNamespaced(subtype))) {
          throw new Error("multiple supertypes are not supported");
        }
        this.supertypesBySubtype.set(
          toNamespaced(subtype),
          toNamespaced(supertype),
        );
      }
    }
  }

  // isSubtype returns whether a is a subtype of b
  isSubtype(a: GrammarType, b: GrammarType): boolean {
    this.assertValidTypeName(typeof a === "string" ? a : a.type);
    this.assertValidTypeName(typeof b === "string" ? b : b.type);
    if (a === b) {
      return true;
    }
    if (typeof a === "string" && typeof b === "string") {
      const aSuper = this.supertypesBySubtype.get(a);
      if (aSuper !== undefined) {
        return this.isSubtype(aSuper, b);
      }
      return false;
    }
    if (
      typeof a !== "string" &&
      Array.isArray(a.parameters) &&
      a.parameters.length === 0
    ) {
      return this.isSubtype(a.type, b);
    }
    if (
      typeof b !== "string" &&
      Array.isArray(b.parameters) &&
      b.parameters.length === 0
    ) {
      return this.isSubtype(a, b.type);
    }
    if (typeof a !== "string" && typeof b !== "string") {
      return (
        a.type === b.type &&
        Array.isArray(a.parameters) &&
        Array.isArray(b.parameters) &&
        a.parameters.length === b.parameters.length &&
        a.parameters.every((p, i) =>
          this.isSubtype(p, (b.parameters as Array<GrammarType>)[i]),
        )
      );
    }
    return false;
  }

  private assertValidTypeName(type: string) {
    if (!this.knownTypeNames.has(type)) {
      throw new Error(`unknown type ${type}`);
    }
  }
}
