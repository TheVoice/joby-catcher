function stepForward() {
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

function open2() {
    servos.P2.setAngle(15)
    pins.servoWritePin(AnalogPin.P8, 90)
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
//  states:
//  0-forward
//  1-left
//  2-right
//  3-open
//  4-close
//  5-stop
let state = 1
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
            music.play(music.builtInPlayableMelody(Melodies.Dadadadum), music.PlaybackMode.UntilDone)
            state = 5
        } else {
            basic.showLeds(`
                . . # . .
                . # . # .
                . # . # .
                . # . # .
                . . # . .
                `)
            state = 1
        }
        
    }
    
})
basic.forever(function on_forever2() {
    if (state == 0) {
        servos.P0.run(100)
        servos.P1.run(100)
    } else if (state == 1) {
        servos.P0.run(50)
        servos.P1.run(-50)
    } else if (state == 2) {
        servos.P0.run(-50)
        servos.P1.run(50)
    } else if (state == 3) {
        
    } else if (state == 4) {
        
    } else if (state == 5) {
        servos.P0.run(0)
        servos.P1.run(0)
        open2()
        basic.pause(100)
        stepForward()
        basic.pause(100)
        close()
    }
    
})
