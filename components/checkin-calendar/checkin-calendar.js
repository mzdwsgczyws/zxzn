Component({
  properties: {
    days: {
      type: Array,
      value: []
    }
  },
  data: {
    today: ''
  },
  lifetimes: {
    attached() {
      const d = new Date()
      this.setData({
        today: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      })
    }
  }
})
