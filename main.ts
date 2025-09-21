function robotInit () {
    huskylens.initI2c()
    huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
    huskylens.clearOSD()
    A_close()
    S_armsClosed = 1
    A_camMoveZ()
}
function readLoop () {
    huskylens.request()
    if (huskylens.isLearned(1)) {
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.xCenter)), 20, 20)
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.yCenter)), 20, 50)
        if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
            S_ballOnScreen = 1
            music.play(music.tonePlayable(440, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        } else {
            if (S_ballOnScreen) {
                S_weCanCatch = 1
            }
            S_ballOnScreen = 0
        }
    }
}
function A_turnRightStep () {
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(10)
    servos.P0.stop()
    servos.P1.stop()
}
function A_turnLeftStep () {
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
}
function A_goForwardStep () {
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
}
function R_search () {
    A_turnLeftStep()
}
function A_camMoveZ () {
    servos.P2.setAngle(100)
}
function A_close () {
    // servos.P2.set_angle(90)
    // pins.servo_write_pin(AnalogPin.P8, 15)
    S_armsClosed = 1
}
function A_open () {
    // servos.P2.set_angle(15)
    // pins.servo_write_pin(AnalogPin.P8, 90)
    S_armsClosed = 0
}
function logicLoop () {
    if (S_ballOnScreen) {
        basic.showLeds(`
            . . # . .
            . # # . .
            # # # . .
            . . # . .
            . . # . .
            `)
        A_open()
        A_goForwardStep()
    } else {
        if (S_weCanCatch) {
            S_weCanCatch = 0
            A_goForwardStep()
            A_goForwardStep()
            A_goForwardStep()
            A_close()
        } else {
            R_search()
        }
        basic.showLeds(`
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . . # . .
            `)
    }
}
let S_weCanCatch = 0
let S_ballOnScreen = 0
let S_armsClosed = 0
basic.showString("ON3-3")
basic.showLeds(`
    . . # # .
    # . . # .
    # # # # #
    # . . # .
    . . # # .
    `)
robotInit()
basic.forever(function () {
    readLoop()
    logicLoop()
})
