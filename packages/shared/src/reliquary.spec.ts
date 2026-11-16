import { describe, expect, test } from "bun:test"
import {
  appendPageToSidebarTree,
  extractPageIdsFromSidebarTree,
  RELIQUARY_MAX_SIDEBAR_DEPTH,
  removePageFromSidebarTree,
  updateNodeInSidebarTree,
  validateSidebarTreeDepth,
  type ReliquarySidebarNode,
} from "./reliquary"

describe("Reliquary sidebar tree helpers", () => {
  test("validates trees up to 5 levels deep and rejects level 6", () => {
    const level5: ReliquarySidebarNode = { id: "n5", label: "Level 5", pageId: "p5" }
    const level4: ReliquarySidebarNode = { id: "n4", label: "Level 4", pageId: "p4", children: [level5] }
    const level3: ReliquarySidebarNode = { id: "n3", label: "Level 3", pageId: "p3", children: [level4] }
    const level2: ReliquarySidebarNode = { id: "n2", label: "Level 2", pageId: "p2", children: [level3] }
    const level1: ReliquarySidebarNode = { id: "n1", label: "Level 1", pageId: "p1", children: [level2] }

    const validRes = validateSidebarTreeDepth([level1])
    expect(validRes.valid).toBe(true)
    expect(validRes.maxDepthFound).toBe(RELIQUARY_MAX_SIDEBAR_DEPTH)

    const level6Tree: ReliquarySidebarNode[] = [
      {
        ...level1,
        children: [
          {
            ...level2,
            children: [
              {
                ...level3,
                children: [
                  {
                    ...level4,
                    children: [
                      {
                        ...level5,
                        children: [{ id: "n6", label: "Level 6", pageId: "p6" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const invalidRes = validateSidebarTreeDepth(level6Tree)
    expect(invalidRes.valid).toBe(false)
    expect(invalidRes.maxDepthFound).toBe(6)
  })

  test("rejects duplicate node ids and duplicate pageIds", () => {
    const dupNode = validateSidebarTreeDepth([
      { id: "same", label: "A", pageId: "p1" },
      { id: "same", label: "B", pageId: "p2" },
    ])
    expect(dupNode.valid).toBe(false)

    const dupPage = validateSidebarTreeDepth([
      { id: "a", label: "A", pageId: "p1" },
      { id: "b", label: "B", pageId: "p1" },
    ])
    expect(dupPage.valid).toBe(false)
  })

  test("extracts ordered unique pageIds ignoring folder nodes", () => {
    const tree: ReliquarySidebarNode[] = [
      {
        id: "folder-1",
        label: "Getting Started",
        pageId: null,
        children: [
          { id: "n1", label: "Install", pageId: "page-1" },
          {
            id: "n2",
            label: "Configure",
            pageId: "page-2",
            children: [{ id: "n3", label: "Env Vars", pageId: "page-3" }],
          },
        ],
      },
      { id: "n4", label: "FAQ", pageId: "page-4" },
    ]

    expect(extractPageIdsFromSidebarTree(tree)).toEqual([
      "page-1",
      "page-2",
      "page-3",
      "page-4",
    ])
  })

  test("removePageFromSidebarTree promotes child nodes up one level in place", () => {
    const tree: ReliquarySidebarNode[] = [
      { id: "n0", label: "Intro", pageId: "p0" },
      {
        id: "n1",
        label: "Parent",
        pageId: "p1",
        children: [
          {
            id: "n2",
            label: "Child A",
            pageId: "p2",
            children: [{ id: "n3", label: "Grandchild", pageId: "p3" }],
          },
          { id: "n4", label: "Child B", pageId: "p4" },
        ],
      },
      { id: "n5", label: "End", pageId: "p5" },
    ]

    const result = removePageFromSidebarTree(tree, "p1")
    expect(result.removed).toBe(true)
    expect(result.nodes.map((n) => n.label)).toEqual([
      "Intro",
      "Child A",
      "Child B",
      "End",
    ])
    expect(result.nodes[1]?.children?.[0]?.pageId).toBe("p3")
    expect(extractPageIdsFromSidebarTree(result.nodes)).toEqual([
      "p0",
      "p2",
      "p3",
      "p4",
      "p5",
    ])
  })

  test("appendPageToSidebarTree enforces max depth 5 and updates existing node metadata", () => {
    const deepTree: ReliquarySidebarNode[] = [
      {
        id: "1",
        label: "L1",
        children: [
          {
            id: "2",
            label: "L2",
            children: [
              {
                id: "3",
                label: "L3",
                children: [
                  {
                    id: "4",
                    label: "L4",
                    children: [{ id: "5", label: "L5", pageId: "p5" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const blocked = appendPageToSidebarTree(
      deepTree,
      { id: "6", label: "L6", pageId: "p6" },
      "5"
    )
    expect(blocked.added).toBe(false)

    const allowed = appendPageToSidebarTree(
      deepTree,
      { id: "5b", label: "L5 Sibling", pageId: "p5b" },
      "4"
    )
    expect(allowed.added).toBe(true)
    expect(validateSidebarTreeDepth(allowed.nodes).maxDepthFound).toBe(5)

    const renamed = updateNodeInSidebarTree(
      allowed.nodes,
      (n) => n.pageId === "p5b",
      (n) => ({ ...n, label: "Renamed L5" })
    )
    expect(renamed.updated).toBe(true)
    expect(renamed.nodes[0]?.children?.[0]?.children?.[0]?.children?.[0]?.children?.[1]?.label).toBe("Renamed L5")
  })
})
