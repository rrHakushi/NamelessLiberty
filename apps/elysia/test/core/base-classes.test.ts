import { describe, it, expect } from 'bun:test'
import { IRISFlags } from '@NamelessLiberty/permissions'
import { BaseService } from '../../src/core/base/base.serv'
import { BaseBorealisMediaService } from '../../src/apps/borealis/_shared/base-media.serv'

class TestService extends BaseService {
  constructor() {
    super('TestService')
  }

  testClamp(page?: number, limit?: number) {
    return this.clampPagination(page, limit, 20, 50)
  }

  testAssertOwner(ownerId: string, callerId: string, permissions?: number[] | null) {
    return this.assertOwnerOrAdmin(ownerId, callerId, permissions, 'cipher')
  }
}

class TestMediaService extends BaseBorealisMediaService {
  constructor() {
    super('TestMediaService')
  }

  testCsv(val?: string) {
    return this.parseCsvList(val)
  }

  testNums(val?: string) {
    return this.parseCsvNumbers(val)
  }

  testMeta() {
    return this.buildPaginationMeta([{ id: 10 }, { id: 9 }], 25, 1, 2, false)
  }
}

describe('BaseService & BaseBorealisMediaService Inheritance', () => {
  const svc = new TestService()
  const mediaSvc = new TestMediaService()

  it('clamps pagination safely', () => {
    expect(svc.testClamp(-5, 999)).toEqual({ page: 1, limit: 50, skip: 0 })
    expect(svc.testClamp(3, 10)).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it('enforces ownership or administrator permission', () => {
    expect(() => svc.testAssertOwner('u1', 'u1', [])).not.toThrow()
    expect(() =>
      svc.testAssertOwner('u1', 'u2', [Number(IRISFlags.ADMINISTRATOR)])
    ).not.toThrow()
    expect(() => svc.testAssertOwner('u1', 'u2', [])).toThrow()
  })

  it('parses CSV filters and builds pagination metadata', () => {
    expect(mediaSvc.testCsv(' Action , Drama , , Sci-Fi ')).toEqual(['Action', 'Drama', 'Sci-Fi'])
    expect(mediaSvc.testNums('2020, 2021, abc, 2022')).toEqual([2020, 2021, 2022])
    expect(mediaSvc.testMeta()).toEqual({
      page: 1,
      limit: 2,
      total: 25,
      totalPages: 13,
      hasNextPage: true,
      hasPrevPage: false,
      nextCursor: 9,
    })
  })
})
