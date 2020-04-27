class AudioListPlayer {
  constructor(segments) {
    this.segments = segments
    this.currentSegmentIndex = 0
    this.segmentStarts = [0]

    for (let i = 0; i < segments.length - 1; i++) {
      this.segmentStarts.push(this.segmentStarts[i] + segments[i].duration)
    }

    this.duration =
      this.segmentStarts[this.segmentStarts.length - 1] +
      this.segments[this.segments.length - 1].duration

    this.segments.forEach((audio, i) => {
      audio.onended = () => {
        const isLast = !this.segments[i + 1]
        if (isLast) {
          this.currentSegmentIndex = 0
        } else {
          this.currentSegmentIndex++
          this.play()
        }
      }
    })
  }

  get currentSegment() {
    return this.segments[this.currentSegmentIndex]
  }

  get currentTime() {
    return (
      this.segmentStarts[this.currentSegmentIndex] +
      this.currentSegment.currentTime
    )
  }

  setTime(seconds) {
    this.currentSegmentIndex = this.segmentStarts.findIndex(
      (val, i, target) => {
        return !target[i + 1] || target[i + 1] > seconds
      }
    )

    const segmentStart = this.segmentStarts[this.currentSegmentIndex]
    const segmentStartAt = seconds - segmentStart

    if (segmentStartAt > this.currentSegment.duration) {
      throw new Error('Selected time is out of bounds!')
    }
    this.currentSegment.currentTime = segmentStartAt
  }

  play() {
    this.currentSegment.play()
  }

  pause() {
    this.currentSegment.pause()
  }
}

const loadAudio = (src) =>
  new Promise((resolve) => {
    const audio = new Audio()
    audio.addEventListener('loadedmetadata', () => resolve(audio))
    audio.preload = 'metadata'
    audio.src = src
  })

const { render, h, Component } = preact
const { useState, useEffect } = preactHooks

const createElements = ((h) => {
  const isObject = (val) => val !== null && val.constructor.name === 'Object'
  const isFunction = (val) => typeof val === 'function'
  const isArray = (val) => val.constructor.name === 'Array'
  const isString = (val) => typeof val === 'string'

  return new Proxy(
    {},
    {
      get(target, tagName) {
        return (...args) => {
          let attrs = {},
            children

          args.forEach((arg) => {
            if (isFunction(arg) || isArray(arg)) {
              children = arg
            } else if (isObject(arg)) {
              Object.assign(attrs, arg)
            } else if (isString(arg)) {
              if (arg.startsWith('.')) {
                attrs.className = arg.slice(1)
              } else if (arg.startsWith('#')) {
                attrs.id = arg.slice(1)
              } else {
                children = arg
              }
            }
          })

          return h(tagName, attrs, children)
        }
      },
    }
  )
})(preact.h)

const { div, h2, button } = createElements

const App = () => {
  const [state, setState] = useState({
    ready: false,
    player: null,
  })

  useEffect(async () => {
    const audios = await Promise.all([
      loadAudio('./1.mp3'),
      loadAudio('./2.mp3'),
      loadAudio('./3.mp3'),
    ])

    const player = new AudioListPlayer(audios)

    setState({ player, ready: true })
  }, [])

  const play = () => {
    state.player.play()
    //state.player.segments[0].play()
    //setInterval(() => {}, 10000000)
  }

  const pause = () => {
    state.player.pause()
  }

  return !state.ready
    ? div('Loading...')
    : div([
        button('play', { onClick: play }),
        button('pause', { onClick: pause }),
      ])
}

render(h(App), document.querySelector('#app'))
