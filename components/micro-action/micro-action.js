const KEYS = require('../../utils/storage-keys.js')

Component({
  properties: {
    actions: { type: Array, value: [] },
    yesterdaySummary: { type: String, value: '' }
  },
  methods: {
    toggle(e) {
      const idx = e.currentTarget.dataset.index
      const actions = this.data.actions.slice()
      if (!actions[idx]) return
      actions[idx] = { ...actions[idx], done: !actions[idx].done }
      this.setData({ actions })
      this.triggerEvent('change', { actions })
      this._persist(actions)
      if (actions[idx].done) {
        try { wx.vibrateShort({ type: 'light' }) } catch (e2) {}
      }
    },
    _persist(actions) {
      try {
        const state = wx.getStorageSync(KEYS.CHECKIN_STATE) || {}
        if (!state.dayLog) state.dayLog = {}
        const d = new Date()
        const t = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
        if (!state.dayLog[t]) state.dayLog[t] = {}
        state.dayLog[t].actions = actions.map(a => ({ text: a.text, done: !!a.done }))
        wx.setStorageSync(KEYS.CHECKIN_STATE, state)
      } catch (e) { console.warn('microAction:persist', e) }
    }
  }
})
