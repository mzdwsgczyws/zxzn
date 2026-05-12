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
  methods: {
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
