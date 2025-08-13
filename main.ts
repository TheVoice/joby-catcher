function open () {
    servos.P2.setAngle(15)
    pins.servoWritePin(AnalogPin.P8, 90)
}
function _catch () {
    open()
    basic.pause(500)
    servos.P0.run(60)
    servos.P1.run(60)
    basic.pause(1000)
    servos.P0.stop()
    servos.P1.stop()
    basic.pause(500)
    close()
}
function leftTurnStep () {
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(10)
    servos.P0.stop()
    servos.P1.stop()
}
function goForward () {
    servos.P0.run(70)
    servos.P1.run(70)
    basic.pause(200)
    servos.P0.stop()
    servos.P1.stop()
}
function rightTurnStep () {
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(10)
    servos.P0.stop()
    servos.P1.stop()
}
function close () {
    servos.P2.setAngle(90)
    pins.servoWritePin(AnalogPin.P8, 30)
}
basic.showString("Hello!")
basic.showLeds(`
    . # . # .
    . . . . .
    . . . . .
    # # . # #
    . # # # .
    `)
close()
basic.forever(function () {
    huskylens.request()
    if (huskylens.isLearned(1)) {
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.xCenter)), 20, 20)
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.yCenter)), 20, 50)
        if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
            basic.showLeds(`
                . . # . .
                . # # . .
                # # # . .
                . . # . .
                . . # . .
                `)
            if (huskylens.readeBox(1, Content1.xCenter) < 140) {
                leftTurnStep()
            } else {
                if (huskylens.readeBox(1, Content1.xCenter) > 180) {
                    rightTurnStep()
                } else {
                    if (huskylens.readeBox(1, Content1.yCenter) < 120) {
                        goForward()
                    } else {
                        _catch()
                    }
                }
            }
        } else {
            basic.showLeds(`
                . . # . .
                . # . # .
                . # . # .
                . # . # .
                . . # . .
                `)
        }
    } else {
        basic.showLeds(`
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . . # . .
            `)
    }
})
