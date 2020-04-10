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

function namespaceGrammar(grammar: Grammar): Grammar {
  function n<T extends GrammarTypeWithParameters | string>(_type: T): T {
    if (typeof _type === "string") {
      return _type.includes(".") ? _type : (`${grammar.name}.${_type}` as any);
    }
    const type: T & GrammarTypeWithParameters = _type as any;
    const output: T & GrammarTypeWithParameters = {
      ...(type as any),
      type: n(type.type),
    };
    if (Array.isArray(type.parameters)) {
      output.parameters = type.parameters.map((t) => n(t));
    } else {
      const newParameters = { ...type.parameters };
      for (const [k, v] of Object.entries(newParameters)) {
        newParameters[k] = v;
      }
      output.parameters = newParameters;
    }
    return output;
  }

  const output: Grammar = { name: grammar.name, unions: {}, types: {} };
  for (const [supertype, subtypes] of Object.entries(grammar.unions)) {
    output.unions[n(supertype)] = subtypes.map((t) => n(t));
  }
  for (const [type, structure] of Object.entries(grammar.types)) {
    output.types[n(type)] = n(structure);
  }
  return output;
}

export class TypeContext {
  private knownTypeNames: Set<string>;
  private supertypesBySubtype: Map<string, string>;
  private typeStructures = new Map<string, GrammarTypeWithParameters>();

  constructor(private _grammar: Grammar) {
    const grammar = namespaceGrammar(_grammar);
    this.knownTypeNames = new Set([
      "primitive.Hole",
      "primitive.Keyed",
      "primitive.List",
      "primitive.Leaf",
      "primitive.String",
      "primitive.Hole",
      "primitive.Nothing",
    ]);
    for (const type of [
      ...Object.keys(grammar.unions),
      ...Object.keys(grammar.types),
    ]) {
      this.knownTypeNames.add(type);
    }
    this.supertypesBySubtype = new Map([
      ["primitive.Nothing", "primitive.Leaf"],
    ]);
    for (const [supertype, subtypes] of Object.entries(grammar.unions)) {
      for (const subtype of subtypes) {
        if (this.supertypesBySubtype.has(subtype)) {
          throw new Error("multiple supertypes are not supported");
        }
        this.supertypesBySubtype.set(subtype, supertype);
      }
    }
    for (const [type, structure] of Object.entries(grammar.types)) {
      this.typeStructures.set(type, structure);
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
    if (typeof a === "string" && typeof b !== "string") {
      const aStructure = this.typeStructures.get(a);
      if (aStructure) {
        return this.isSubtype(aStructure, b);
      }
    }
    return false;
  }

  private assertValidTypeName(type: string) {
    if (!this.knownTypeNames.has(type)) {
      throw new Error(`unknown type ${type}`);
    }
  }
}
