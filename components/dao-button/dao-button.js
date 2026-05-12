Component({
  properties: {
    type: {
      type: String,
      value: 'primary'
    },
    loading: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    },
    block: {
      type: Boolean,
      value: false
    },
    size: {
      type: String,
      value: 'normal'
    }
  },
  methods: {
    onTap(e) {
      if (this.data.disabled || this.data.loading) return
      this.triggerEvent('tap', e.detail)
    }
  }
})
