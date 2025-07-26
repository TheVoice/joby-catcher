function open2() {
    servos.P2.setAngle(15)
    pins.servoWritePin(AnalogPin.P8, 90)
}

function leftTurnStep() {
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
}

function close() {
    servos.P2.setAngle(90)
    pins.servoWritePin(AnalogPin.P8, 15)
}

basic.showString("Hello!")
basic.showLeds(`
    . # . # .
    . . . . .
    . . . . .
    # # . # #
    . # # # .
    `)
huskylens.initI2c()
huskylens.initMode(protocolAlgorithm.ALGORITHM_OBJECT_TRACKING)
huskylens.clearOSD()
close()
basic.forever(function on_forever() {
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
            open2()
            leftTurnStep()
        } else {
            basic.showLeds(`
                . . # . .
                . # . # .
                . # . # .
                . # . # .
                . . # . .
                `)
            close()
        }
        
    }
    
})
