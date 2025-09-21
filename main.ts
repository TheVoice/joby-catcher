function robotInit() {
    
    
    huskylens.initI2c()
    huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
    huskylens.clearOSD()
    A_close()
    S_armsClosed = 1
    A_camMoveZ()
    state = "SEARCHING"
}

function readLoop() {
    
    huskylens.request()
    if (huskylens.isLearned(1)) {
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.xCenter)), 20, 20)
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.yCenter)), 20, 50)
        if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
            state = "MOVING"
            music.play(music.tonePlayable(Note.G, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        } else {
            state = "SEARCHING"
            music.play(music.tonePlayable(Note.C, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
        
    }
    
}

function A_turnRightStep() {
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(10)
    servos.P0.stop()
    servos.P1.stop()
}

function A_turnLeftStep() {
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
}

function A_goForwardStep() {
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
}

function R_search() {
    A_turnLeftStep()
}

function A_camMoveZ() {
    servos.P2.setAngle(90)
}

function A_close() {
    
    //  servos.P2.set_angle(90)
    //  pins.servo_write_pin(AnalogPin.P8, 15)
    S_armsClosed = 1
}

function A_open() {
    
    //  servos.P2.set_angle(15)
    //  pins.servo_write_pin(AnalogPin.P8, 90)
    S_armsClosed = 0
}

let S_weCanCatch = 0
let S_ballOnScreen = 0
let S_armsClosed = 0
basic.showString("ON3-2")
basic.showLeds(`
    . . # # .
    # . . # .
    # # # # #
    # . . # .
    . . # # .
    `)
let state = ""
robotInit()
function stateLoop() {
    if (state == "WAITING") {
        servos.P0.run(0)
        servos.P1.run(0)
    } else if (state == "MOVING") {
        basic.showLeds(`
            . . # . .
            . # # . .
            # # # . .
            . . # . .
            . . # . .
            `)
        servos.P0.run(100)
        servos.P1.run(100)
    } else if (state == "SEARCHING") {
        basic.showLeds(`
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . . # . .
            `)
        servos.P0.run(30)
        servos.P1.run(-30)
    } else if (state == "FETCHING") {
        
    } else if (state == "CATCHING") {
        
    } else if (state == "DROPPING") {
        
    } else if (state == "STOPPED") {
        
    } else if (state == "TO_SAFETY") {
        
    } else if (state == "MISSION_COMPLETED") {
        
    }
    
}

basic.forever(function on_forever() {
    readLoop()
    stateLoop()
})
