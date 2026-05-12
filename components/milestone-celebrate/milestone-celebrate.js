Component({
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    streak: { type: Number, value: 0 },
    body: { type: String, value: '' }
  },
  methods: {
    noop() {},
    onClose() {
      this.triggerEvent('close')
    }
  }
})
