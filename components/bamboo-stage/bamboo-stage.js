Component({
  properties: {
    phase: {
      type: String,
      value: 'shake'
    },
    shaking: {
      type: Boolean,
      value: false
    },
    shakeHint: {
      type: String,
      value: ''
    },
    showSimTip: {
      type: Boolean,
      value: true
    },
    simTipText: {
      type: String,
      value: '模拟器无感应？点此完成生成'
    },
    variant: {
      type: String,
      value: 'home'
    }
  },
  methods: {
    onSimTap() {
      this.triggerEvent('simtap')
    }
  }
})
