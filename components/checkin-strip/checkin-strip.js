Component({
  properties: {
    streak: { type: Number, value: 0 },
    totalDays: { type: Number, value: 0 },
    checkedToday: { type: Boolean, value: false },
    expanded: { type: Boolean, value: false },
    selectedMood: { type: String, value: '' }
  },
  data: {
    checkinFlash: false,
    moodOptions: ['😌', '😊', '😐', '😢', '😤']
  },
  observers: {
    checkedToday(val) {
      if (this._collapseTimer) clearTimeout(this._collapseTimer)
      if (val && this.data.expanded) {
        this._collapseTimer = setTimeout(() => {
          this.triggerEvent('toggle', { expanded: false })
        }, 1200)
      }
    }
  },
  lifetimes: {
    detached() {
      if (this._collapseTimer) clearTimeout(this._collapseTimer)
    }
  },
  methods: {
    onTapToggle() {
      this.triggerEvent('toggle', { expanded: !this.data.expanded })
    },
    onTapCheckin() {
      if (this.data.checkedToday) return
      this.setData({ checkinFlash: true })
      setTimeout(() => this.setData({ checkinFlash: false }), 600)
      this.triggerEvent('checkin')
    },
    onPickMood(e) {
      const mood = e.currentTarget.dataset.mood
      this.triggerEvent('moodpick', { mood })
    }
  }
})
