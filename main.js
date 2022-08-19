const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const PLAYER_STORAGE_KEY = 'F8_PLAYER'

const player = $('.player')
const cd = $('.cd')
const heading = $('header h2')
const cdThumb = $('.cd-thumb')
const audio = $('#audio')
const playBtn = $('.btn-toggle-play')
const progress = $('#progress')
const prevBtn = $('.btn-prev')
const nextBtn = $('.btn-next')
const randomBtn = $('.btn-random')
const repeatBtn = $('.btn-repeat')
const playlist = $('.playlist')

// var songApi = 'http://localhost:3000/song'
// function getSong(callback) {
//     fetch(songApi)
//         .then(response => {
//             // console.log(response)
//             return response.json()
//         })
//         .then(data => 
//             callback(data));
// }

//
import myJson from './db.json' assert { type: "json" };
//cách 1:
// const mySong = myJson 

const app = {
    listSongs:[],
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},

    //Hướng dẫn cài đặt JSON server:
    /**
     * 1. đứng tại thư mục gõ vào TERMINAL gõ npm init
     * 2. Enter liên tục cho đến khi xuất hiện dòng chữ "Is this OK? (yes)" thì gõ yes hoặc enter
     * 3. gõ npm i json-server
     * 4. tạo 1 file json vd đặt tên là db.json
     * 5. trong thư mục package.json thêm dòng "start": "json-server --watch db.json", vao trong "scrip: {}"
     * 6. trong TERMINAL gõ npm start
     */

    //cách 1: Dùng JSON.stringify để convert array to strin, 
    //          rồi dùng JSON.parse để convert stringify to Object
    // song: JSON.parse(JSON.stringify((mySong))),

    //cách 2: dùng toán tử spread để rải mảng [...myJson]
    song: [...myJson],
    setConfig: function (key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config))
    },

    render: function () {
        const htmls =app.song.map((song, index) => {
            return `
                <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                    <div class="thumb"
                        style="background-image: url('${song.image}')">
                    </div>
                    <div class="body">
                        <h5 class="title">${song.name}</h5>
                        <p class="author">${song.singer}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
            `
        })
        playlist.innerHTML = htmls.join('')
    },

    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.song[this.currentIndex]
            }
        })
    },

    //Xử lý sự kiện
    handleEvents: function () {
        const _this = this
        const cdWidth = cd.offsetWidth

        //Xử lý CD quay / dừng
        const cdThumbAnimate = cdThumb.animate([
            { transform: 'rotate(360deg)' }
        ], {
            duration: 20000, //10s
            iterations: Infinity, //Kiểu lặp lại: Vô hạn
        })
        cdThumbAnimate.pause(); //Lúc mới vào không quay

        //Xử lý phóng to, thu nhỏ CD
        document.onscroll = function () {
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const newCdWidth = cdWidth - scrollTop

            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0
            cd.style.opacity = newCdWidth / cdWidth
        };

        //Xử lý khi click play
        playBtn.onclick = function () {
            if (_this.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        };

        //Khi song được play
        audio.onplay = function () {
            _this.isPlaying = true
            player.classList.add('playing')
            cdThumbAnimate.play() //khi song play, CD quay
        }

        //Khi song được pause
        audio.onpause = function () {
            _this.isPlaying = false
            player.classList.remove('playing')
            cdThumbAnimate.pause() //khi song pause, CD dừng tại vị trí hiện tại

        }

        //Thay đổi tiến độ bài 
        audio.ontimeupdate = function () {
            if (audio.duration) {
                const progressPercent = Math.floor(
                    (audio.currentTime / audio.duration) * 100)
                progress.value = progressPercent
            }
        };

        // Xử lý khi tua
        progress.onchange = function (e) {
            const seekTime = (audio.duration / 100) * e.target.value
            audio.currentTime = seekTime
        };

        // Xử lý khi chuyển bài hát (next song)
        nextBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else {
                _this.nextSong()
            }
            audio.play()
            _this.render()
            _this.scrollToActiveSong()

            if (document.querySelector(".song.active").offsetTop <= 203) {
				window.scrollTo({ top: 408 + "px", behavior: "smooth" });
			}
        };

        // Xử lý khi chuyển bài hát (prev song)
        prevBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else {
                _this.prevSong()
            }
            audio.play()
            _this.render()
            _this.scrollToActiveSong()

            if (document.querySelector(".song.active").offsetTop <= 203) {
				window.scrollTo({ top: 408 + "px", behavior: "smooth" });
			}
        }

        // Xử lý khi bấm random bài hát (random song)
        randomBtn.onclick = function (e) {
            _this.isRandom = !_this.isRandom //khi click randomBtn nó tự phủ định chính nó
            // _this.isRandom = !_this.isRepeat
            _this.setConfig('isRandom', _this.isRandom)
            randomBtn.classList.toggle('active', _this.isRandom)
        }

        // Xử lý repeat bài hát
        repeatBtn.onclick = function (e) {
            _this.isRepeat = !_this.isRepeat
            // _this.isRepeat = !_this.isRandom
            _this.setConfig('isRepeat', _this.isRepeat)
            repeatBtn.classList.toggle('active', _this.isRepeat)
        }

        //xử lý nextSong khi audio ended
        audio.onended = function () {
            if (_this.isRepeat) {
                audio.play()
            } else {
                nextBtn.click()
            }
        }

        // Xử lý khi clcik bài hát khác
        playlist.onclick = function (e) {
            // Xử lý khi click vaof song
            const songNode = e.target.closest('.song:not(.active)')

            if (songNode || e.target.closest('.option')) {
                // Xử lý Khi click vào biểu tượng bài hát
                if (songNode) {
                    _this.currentIndex = Number(songNode.dataset.index)
                    _this.loadCurrentSong()
                    _this.render()
                    audio.play()
                }
                //Xử lý khi click vào song option
                if (e.target.closest('.option')) {

                }

            }
        }
    },

    // Xử lý hành vi cuộn danh sách (khi bài hát đến cuối màn hình hiển thị, tự động cuộn )
    scrollToActiveSong: function () {
        setTimeout(() => {
            $('.song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: "nearest"
            })
        }, 100)
    },

    //Tải bài hát
    loadCurrentSong: function () {
        heading.textContent = this.currentSong.name
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`
        audio.src = this.currentSong.path
    },

    //Tai config
    loadConfig: function () {
        this.isRandom = this.config.isRandom
        this.isRepeat = this.config.isRepeat
    },

    //Chuyển bài hát tiếp theo trong danh sách
    nextSong: function () {
        this.currentIndex++
        if (this.currentIndex >= this.song.length) {
            this.currentIndex = 0
        }
        this.loadCurrentSong()
    },

    //chuyển lùi bài hát
    prevSong: function () {
        this.currentIndex--
        if (this.currentIndex < 0) {
            this.currentIndex = this.song.length - 1
        }
        this.loadCurrentSong()
    },

    // random bài hát
    playRandomSong: function () {
        let newIndex
        do {
            newIndex = Math.floor(Math.random() * this.song.length)
        } while (newIndex === this.currentIndex)

        this.currentIndex = newIndex
        this.loadCurrentSong()
    },

    start: function () {
        // getSong(function(song) {
        //     console.log('this is song' , song)

        //     app.listSongs = song
        //     console.log(app.listSongs)
        // })
        // Gán cấu hình từ config vào ứng dụng
        this.loadConfig()

        //Định nghĩa các thuộc tính cho Object
        this.defineProperties()

        //Lắng nghe / xử lý các sự kiện (DOM events)
        this.handleEvents()

        //Tải thông tin bài hát đàu tiên vào UI khi chạy ứng dụng
        this.loadCurrentSong()

        //render playlist
        app.render()

        //Hiển thị trạng thái ban đầu của button repeatBtn và randomBtn
        randomBtn.classList.toggle('active', this.isRandom)
        repeatBtn.classList.toggle('active', this.isRepeat)
    }
}

app.start()
console.log(app.song)

