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

function keyedToObject(value: any): { [key: string]: unknown } {
  return value.keyed;
}

function construct(type: GrammarType, value: any): unknown {
  if (typeof type !== "string" && type.type === "primitive.Keyed") {
    return value.keyed;
  }
  console.error(type);
  throw new Error("unsupported type");
}

interface Lens<C, A> {
  concrete: string;
  abstract: string;
  get: (concrete: C) => A | undefined;
  put: (concrete: C, abstract: A) => C | undefined;
}

const expressionsAsStatementsLens: Lens<unknown, unknown> = {
  concrete: "lang.ExpressionStatement",
  abstract: "lang.Expression",
  get: (concrete) => keyedToObject(concrete).value,
  put: (concrete, abstract) =>
    construct("lang.ExpressionStatement", { expression: abstract }),
};
