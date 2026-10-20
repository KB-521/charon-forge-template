// Generated from schemas/*.schema.json; run node scripts/generate-schemas.mjs.
export const templateSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
      "maxLength": 80
    },
    "version": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"
    },
    "schemaVersion": {
      "const": 1
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
    },
    "category": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
      "maxLength": 80
    },
    "layout": {
      "enum": [
        "single",
        "monorepo"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 256,
        "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
      },
      "uniqueItems": true
    },
    "minCliVersion": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"
    },
    "requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "tool": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
          },
          "range": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
          },
          "phase": {
            "enum": [
              "install",
              "verify"
            ]
          }
        },
        "required": [
          "tool",
          "range",
          "phase"
        ],
        "additionalProperties": false
      }
    },
    "source": {
      "const": "files"
    },
    "inputs": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "type": {
            "const": "string"
          },
          "required": {
            "type": "boolean"
          },
          "default": {
            "type": "string",
            "maxLength": 256
          },
          "pattern": {
            "type": "string",
            "maxLength": 256
          },
          "minLength": {
            "type": "integer",
            "minimum": 0
          },
          "maxLength": {
            "type": "integer",
            "minimum": 1,
            "maximum": 256
          }
        },
        "required": [
          "type",
          "required"
        ],
        "additionalProperties": false
      }
    },
    "render": {
      "type": "object",
      "properties": {
        "tokens": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
          }
        },
        "files": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
          },
          "uniqueItems": true
        }
      },
      "required": [
        "tokens",
        "files"
      ],
      "additionalProperties": false
    },
    "publish": {
      "type": "object",
      "properties": {
        "include": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
          },
          "minItems": 1,
          "uniqueItems": true
        }
      },
      "required": [
        "include"
      ],
      "additionalProperties": false
    },
    "install": {
      "type": "object",
      "properties": {
        "adapter": {
          "enum": [
            "node",
            "python-uv",
            "manual"
          ]
        },
        "packageManagers": {
          "type": "array",
          "items": {
            "enum": [
              "pnpm",
              "npm",
              "yarn"
            ]
          },
          "minItems": 1,
          "uniqueItems": true
        }
      },
      "required": [
        "adapter"
      ],
      "additionalProperties": false
    },
    "verify": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "argv": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 256,
              "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
            },
            "minItems": 1
          }
        },
        "required": [
          "argv"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "id",
    "version",
    "schemaVersion",
    "name",
    "category",
    "layout",
    "tags",
    "minCliVersion",
    "requirements",
    "source",
    "inputs",
    "render",
    "publish",
    "install",
    "verify"
  ],
  "additionalProperties": false
} as const;
export const catalogSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "schemaVersion": {
      "const": 1
    },
    "catalogVersion": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
    },
    "templates": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "recommendedVersions": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"
            },
            "uniqueItems": true
          },
          "versions": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
                  "maxLength": 80
                },
                "version": {
                  "type": "string",
                  "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"
                },
                "schemaVersion": {
                  "type": "integer",
                  "minimum": 1
                },
                "name": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 256,
                  "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
                },
                "category": {
                  "type": "string",
                  "pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
                  "maxLength": 80
                },
                "layout": {
                  "enum": [
                    "single",
                    "monorepo"
                  ]
                },
                "tags": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 256,
                    "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
                  },
                  "uniqueItems": true
                },
                "minCliVersion": {
                  "type": "string",
                  "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"
                },
                "requirements": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "tool": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 256,
                        "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
                      },
                      "range": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 256,
                        "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
                      },
                      "phase": {
                        "enum": [
                          "install",
                          "verify"
                        ]
                      }
                    },
                    "required": [
                      "tool",
                      "range",
                      "phase"
                    ],
                    "additionalProperties": false
                  }
                },
                "artifactUrl": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 256,
                  "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
                },
                "sha256": {
                  "type": "string",
                  "pattern": "^[a-f0-9]{64}$"
                }
              },
              "required": [
                "id",
                "version",
                "schemaVersion",
                "name",
                "category",
                "layout",
                "tags",
                "minCliVersion",
                "requirements",
                "artifactUrl",
                "sha256"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "recommendedVersions",
          "versions"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "schemaVersion",
    "catalogVersion",
    "templates"
  ],
  "additionalProperties": false
} as const;
export const channelSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "schemaVersion": {
      "const": 1
    },
    "catalogVersion": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
    },
    "catalogUrl": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
    },
    "sha256": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    }
  },
  "required": [
    "schemaVersion",
    "catalogVersion",
    "catalogUrl",
    "sha256"
  ],
  "additionalProperties": false
} as const;
export const generationRecordSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "schemaVersion": {
      "const": 1
    },
    "source": {
      "enum": [
        "catalog",
        "local-dev"
      ]
    },
    "cliVersion": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"
    },
    "templateId": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
      "maxLength": 80
    },
    "templateVersion": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"
    },
    "catalogVersion": {
      "type": [
        "string",
        "null"
      ]
    },
    "catalogSha256": {
      "anyOf": [
        {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        },
        {
          "type": "null"
        }
      ]
    },
    "artifactSha256": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "inputs": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    },
    "createdAt": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "pattern": "^[^\\u0000-\\u001f\\u007f]+$"
    },
    "sourceCommit": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "schemaVersion",
    "source",
    "cliVersion",
    "templateId",
    "templateVersion",
    "catalogVersion",
    "catalogSha256",
    "artifactSha256",
    "inputs",
    "createdAt"
  ],
  "additionalProperties": false
} as const;
