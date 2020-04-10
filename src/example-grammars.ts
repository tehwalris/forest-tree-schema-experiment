import { Grammar } from ".";

export const langGrammar: Grammar = {
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

export const emptyGrammar: Grammar = {
  name: "empty",
  unions: {},
  types: {},
};
