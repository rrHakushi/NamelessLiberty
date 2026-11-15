"use client"

import * as React from "react"
import { IconListNumbers } from "@tabler/icons-react"
import { AlgoBuilder, type AlgoDocument } from "@/components/algo-builder"

const INITIAL_ALGO: AlgoDocument = {
  id: "create-book-algo",
  title: "createBook — Execution Algorithm",
  description: "Demonstrates all 10 AlgoBuilder node types in both Render and Edit mode.",
  steps: [
    {
      id: "s1",
      kind: "step",
      title: "Validation of dtoIn",
      description: "Validates incoming request parameters against TypeBox schema.",
    },
    {
      id: "s2",
      kind: "sequence",
      title: "Checks business state of application",
      description: "Verifies existence and business state of the `library` workspace.",
      children: [
        {
          id: "s2_1",
          kind: "alg_call",
          title: "Load library by awid",
          isAsync: true,
          assignTo: "library",
          targetAlg: "libraryDao.getByAwid",
          callArgs: "dtoIn.awid",
        },
        {
          id: "s2_2",
          kind: "selection",
          title: "Verify library exists",
          selectionMode: "if_else",
          condition: "`!library`",
          thenBranch: [
            {
              id: "s2_2_err",
              kind: "error",
              condition: "The library is not found based on `awid`",
              code: "libraryDoesNotExist",
              httpStatus: 404,
              message: "UuObject library does not exist.",
              payload: '{\n  "awid": "$.awid"\n}',
              payloadLanguage: "json",
            },
          ],
          elseBranch: [],
        },
      ],
    },
    {
      id: "s3",
      kind: "sequence",
      title: "Checks the existence of authors",
      description: "Iterates through `dtoIn.authorOidList` and collects existing authors.",
      children: [
        {
          id: "s3_var",
          kind: "var_def",
          title: "Initialize existing authors list",
          varMutable: false,
          varName: "existingAuthorOidList",
          varType: "string[]",
          varValue: "[]",
        },
        {
          id: "s3_loop",
          kind: "iteration",
          title: "Verify each author",
          loopType: "for_each",
          iterator: "authorOid",
          collection: "dtoIn.authorOidList",
          children: [
            {
              id: "s3_warn",
              kind: "warning",
              condition: "One or more authors do not exist, but at least one is available",
              code: "someAuthorsDoNotExist",
              message: "One or more authors with given oid do not exist.",
              payload: '{\n  "authorOidList": ["..."]\n}',
              payloadLanguage: "json",
            },
          ],
        },
      ],
    },
    {
      id: "s4",
      kind: "try_catch_finally",
      title: "Persist book entity safely",
      catchVar: "dbErr",
      tryBlock: [
        {
          id: "s4_call",
          kind: "alg_call",
          title: "Insert book record",
          isAsync: true,
          assignTo: "createdBook",
          targetAlg: "bookDao.create",
          callArgs: "{ ...dtoIn, authorOidList: existingAuthorOidList }",
        },
      ],
      catchBlock: [
        {
          id: "s4_err",
          kind: "error",
          condition: "Database write failed",
          code: "bookCreateFailed",
          httpStatus: 500,
          message: "Failed to persist book record.",
        },
      ],
      finallyBlock: [
        {
          id: "s4_fin",
          kind: "step",
          title: "Release transaction lock",
        },
      ],
    },
    {
      id: "s5",
      kind: "return",
      title: "Return created book",
      returnValue: "{ success: true, book: createdBook }",
      returnType: "CreateBookDtoOut",
    },
  ],
}

export default function AlgoBuilderPage() {
  const [doc, setDoc] = React.useState<AlgoDocument>(INITIAL_ALGO)

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1.5 text-start">
        <div className="flex items-center gap-2.5">
          <IconListNumbers className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Algorithm Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Switch between <strong>Render</strong> and <strong>Edit</strong> modes to inspect or author
          hierarchical algorithms with steps, sequences, selections, iterations, try/catch/finally,
          variable definitions, algorithm calls, warnings, errors, and returns.
        </p>
      </header>

      <AlgoBuilder value={doc} onChange={setDoc} mode="render" allowModeToggle />
    </main>
  )
}
