{
  "id": "core/email/templates/PasswordResetEmail.tsx",
  "title": "PasswordResetEmail.tsx",
  "description": "",
  "icon": "IconFileCode",
  "metadata": {
    "pathname": "apps/elysia/src/core/email/templates/PasswordResetEmail.tsx",
    "relPath": "core/email/templates/PasswordResetEmail.tsx",
    "role": "Module",
    "methods": [],
    "routePaths": [],
    "errorCount": 0
  },
  "root": {
    "type": "div",
    "props": {
      "className": "space-y-6"
    },
    "children": [
      {
        "type": "Card",
        "props": {
          "className": "rounded-2xl"
        },
        "children": [
          {
            "type": "CardHeader",
            "children": [
              {
                "type": "div",
                "props": {
                  "className": "flex items-center justify-between gap-2"
                },
                "children": [
                  {
                    "type": "div",
                    "props": {
                      "className": "flex items-center gap-2"
                    },
                    "children": [
                      {
                        "type": "IconFileCode",
                        "props": {
                          "className": "size-5 text-primary shrink-0"
                        }
                      },
                      {
                        "type": "CardTitle",
                        "props": {
                          "className": "text-xl text-start"
                        },
                        "text": "PasswordResetEmail.tsx"
                      }
                    ]
                  },
                  {
                    "type": "Badge",
                    "props": {
                      "variant": "outline",
                      "className": "font-mono text-xs"
                    },
                    "text": "Module"
                  }
                ]
              }
            ]
          },
          {
            "type": "CardContent",
            "props": {
              "className": "space-y-4"
            },
            "children": [
              {
                "type": "div",
                "props": {
                  "className": "space-y-2 text-start"
                },
                "children": [
                  {
                    "type": "div",
                    "props": {
                      "className": "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    },
                    "text": "Pathname"
                  },
                  {
                    "type": "div",
                    "props": {
                      "className": "flex flex-col gap-2"
                    },
                    "children": [
                      {
                        "type": "code",
                        "props": {
                          "className": "rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-foreground"
                        },
                        "text": "apps/elysia/src/core/email/templates/PasswordResetEmail.tsx"
                      }
                    ]
                  }
                ]
              },
              {
                "type": "Separator"
              },
              {
                "type": "div",
                "props": {
                  "className": "rounded-xl border border-border/60 bg-muted/20 p-3 text-start space-y-2"
                },
                "children": [
                  {
                    "type": "div",
                    "props": {
                      "className": "flex items-center justify-between gap-2"
                    },
                    "children": [
                      {
                        "type": "div",
                        "props": {
                          "className": "text-[11px] text-muted-foreground"
                        },
                        "text": "Dependents / Callers"
                      },
                      {
                        "type": "div",
                        "props": {
                          "className": "font-mono text-[11px] text-muted-foreground"
                        },
                        "text": "0 caller(s)"
                      }
                    ]
                  },
                  {
                    "type": "div",
                    "props": {
                      "className": "font-mono text-xs text-muted-foreground"
                    },
                    "text": "None"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "div",
        "props": {
          "className": "space-y-4"
        },
        "children": [
          {
            "type": "AlgoBuilder",
            "key": "exp-algo-PasswordResetEmail",
            "props": {
              "mode": "render",
              "allowModeToggle": true,
              "defaultValue": {
                "id": "core/email/templates/PasswordResetEmail.tsx-PasswordResetEmail",
                "title": "const PasswordResetEmail",
                "description": "Exported algorithm sequence",
                "steps": [
                  {
                    "id": "exp_PasswordResetEmail_0_1",
                    "kind": "return",
                    "title": "",
                    "returnValue": "`<Html> <Head /> <Preview>{`Reset your ${appName} password`}</Preview> <Body style={main}> <Container style={container}> {/* Header */} <Section style={headerSection}> ...`"
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  }
}
