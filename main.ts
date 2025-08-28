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
//  WAITING
//  MOVING
//  SEARCHING
//  FETCHING
//  CATCHING
//  DROPPING
//  STOPPED
//  TO_SAFETY
//  MISSION_COMPLETED
let state = "WAITING"
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
            state = "FETCHING"
        } else {
            basic.showLeds(`
                . . # . .
                . # . # .
                . # . # .
                . # . # .
                . . # . .
                `)
            state = "SEARCHING"
        }
        
    }
    
})
basic.forever(function on_forever2() {
    if (state == "WAITING") {
        servos.P0.run(0)
        servos.P1.run(0)
    } else if (state == "MOVING") {
        servos.P0.run(100)
        servos.P1.run(100)
    } else if (state == "SEARCHING") {
        servos.P0.run(-50)
        servos.P1.run(50)
    } else if (state == "FETCHING") {
        
    } else if (state == "CATCHING") {
        
    } else if (state == "DROPPING") {
        
    } else if (state == "STOPPED") {
        
    } else if (state == "TO_SAFETY") {
        
    } else if (state == "MISSION_COMPLETED") {
        
    }
    
})
