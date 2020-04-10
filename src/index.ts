interface GrammarTypeWithParameters {
  type: string;
  parameters: { [key: string]: GrammarType } | GrammarType[];
}

type GrammarType = string | GrammarTypeWithParameters;

interface Grammar {
  name: string;
  unions: { [key: string]: string[] };
  types: { [key: string]: GrammarTypeWithParameters };
}

const langGrammar: Grammar = {
  name: "lang",
  unions: {
    Statement: ["IfStatement", "ExpressionStatement", "Declaration", "Block"],
    Declaration: ["FunctionDeclaration"],
    Expression: ["Identifier", "BooleanLiteral", "FunctionCall"],
    Type: ["BooleanKeywordType"],
    BooleanLiteral: ["BooleanLiteralTrue", "BooleanLiteralFalse"],
  },
  types: {
    Program: {
      type: "primitive.List",
      parameters: ["Statement"],
    },
    IfStatement: {
      type: "primitive.Keyed",
      parameters: {
        condition: "Expression",
        thenStatement: "Statement",
        elseStatement: {
          type: "primitive.Option",
          parameters: ["Statement"],
        },
      },
    },
    ExpressionStatement: {
      type: "primitive.Keyed",
      parameters: {
        expression: "Expression",
      },
    },
    FunctionDeclaration: {
      type: "primitive.Keyed",
      parameters: {
        name: "primitive.String",
        parameters: {
          type: "primitive.List",
          parameters: ["FunctionParameters"],
        },
        body: {
          type: "primitive.Option",
          parameters: ["Block"],
        },
      },
    },
    Identifier: {
      type: "primitive.Keyed",
      parameters: {
        name: "primitive.String",
      },
    },
    BooleanLiteralTrue: {
      type: "primitive.Leaf",
      parameters: [],
    },
    BooleanLiteralFalse: {
      type: "primitive.Leaf",
      parameters: [],
    },
    FunctionCall: {
      type: "primitive.Keyed",
      parameters: {
        function: "Identifier",
        arguments: {
          type: "primitive.List",
          parameters: ["Expression"],
        },
      },
    },
    BooleanKeywordType: {
      type: "primitive.Leaf",
      parameters: [],
    },
    Block: {
      type: "primitive.Keyed",
      parameters: {
        statements: {
          type: "primitive.List",
          parameters: ["Statement"],
        },
      },
    },
    FunctionParameter: {
      type: "primitive.Keyed",
      parameters: {
        name: "primitive.String",
        type: {
          type: "primitive.Option",
          parameters: ["Type"],
        },
      },
    },
  },
};

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
  | OptionTreeNodeValue
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

interface OptionTreeNodeValue {
  type: "primitive.Option";
  value: UnknownTreeNode | undefined;
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

// isSubtype returns whether a is a subtype of b
export function isSubtype(a: GrammarType, b: GrammarType): boolean {
  if (a === b) {
    return true;
  }
  return false;
}
