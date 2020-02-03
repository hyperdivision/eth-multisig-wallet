/* global artifacts, contract, it, assert */

const MultiOwnerConcrete = artifacts.require('tests/MultiOwnerConcrete')

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
contract('MultiOwnerConcrete', async accounts => {
  it('simple', async () => {
    const invariant = new Set()
    const inst = await MultiOwnerConcrete.new()

    for (var i = 0; i < 100; i++) {
      var r = Math.random()

      if (r <= 0.25) {
        await add(accounts[Math.random() * accounts.length | 0])
      } else if (r <= 0.5) {
        await remove(accounts[Math.random() * accounts.length | 0])
      } else if (r <= 0.75) {
        await replace(accounts[Math.random() * accounts.length | 0], accounts[Math.random() * accounts.length | 0])
      }

      await equal()
    }

    async function add (elm) {
      if (invariant.has(elm)) {
        try {
          await inst.addOwnerT(elm)
          assert.fail()
        } catch (ex) {
          assert.ok(ex)
        }
      } else {
        invariant.add(elm)
        assert.ok(await inst.addOwnerT(elm))
      }

      await equal()
    }

    async function remove (elm) {
      if (!invariant.has(elm) || invariant.size < 2) {
        try {
          await inst.removeOwnerT(elm)
          assert.fail()
        } catch (ex) {
          assert.ok(ex)
        }
      } else {
        assert.ok(invariant.delete(elm))
        assert.ok(await inst.removeOwnerT(elm))
      }

      await equal()
    }

    async function replace (a, b) {
      if (!invariant.has(a) || invariant.has(b)) {
        try {
          await inst.replaceOwnerT(a, b)
          assert.fail()
        } catch (ex) {
          assert.ok(ex)
        }
      } else {
        assert.ok(invariant.delete(a))
        invariant.add(b)
        assert.ok(await inst.replaceOwnerT(a, b))
      }

      await equal()
    }

    async function equal () {
      var sliceInTime = new Set(Array.from(await inst.allOwners()))
      assert.sameMembers(Array.from(sliceInTime), Array.from(invariant))

      for (const owner of accounts) {
        if (invariant.has(owner)) {
          assert.ok(await inst.isOwner(owner))
        } else {
          assert.notOk(await inst.isOwner(owner))
        }
      }

      assert.deepEqual(await inst.outOfBounds(sliceInTime.size), ZERO_ADDR)
    }
  })
})
