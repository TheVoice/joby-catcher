function robotInit() {
    
    // Initialize radio connectivity
    UTBBot.initAsBot(UTBBotCode.TeamName.AmaBot)
    UTBBot.newBotStatus(UTBBotCode.BotStatus.WAITING)
    // Initialize camera
    huskylens.initI2c()
    huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
    huskylens.clearOSD()
    A_close()
    S_armsClosed = 1
    A_camMoveZ()
    state = "WAITING"
    billy.voicePreset(BillyVoicePreset.LittleRobot)
}

control.inBackground(function on_in_background() {
    UTBBot.emitStatus()
    basic.pause(5000)
})
UTBBot.onMessageStartReceived(function on_message_start_received() {
    
    billy.say("Starting mission")
    state = "SEARCHING"
})
UTBBot.onMessageDangerReceived(function on_message_danger_received() {
    
    billy.say("Returning to base")
    state = "TO_SAFETY"
})
UTBBot.onMessageStopReceived(function on_message_stop_received() {
    billy.say("Ending mission")
})
function readLoop() {
    
    degrees = input.compassHeading()
    if (degrees < 45) {
        basic.showArrow(ArrowNames.North)
    } else if (degrees < 135) {
        basic.showArrow(ArrowNames.East)
    } else if (degrees < 225) {
        basic.showArrow(ArrowNames.South)
    } else if (degrees < 315) {
        basic.showArrow(ArrowNames.West)
    } else {
        basic.showArrow(ArrowNames.North)
    }
    
    huskylens.request()
    if (huskylens.isLearned(1)) {
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.xCenter)), 20, 20)
        huskylens.writeOSD(convertToText(huskylens.readeBox(1, Content1.yCenter)), 20, 50)
        if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
            state = "MOVING"
        } else {
            state = "SEARCHING"
        }
        
    }
    
}

//  ROBOT COMMUNICATION
//  time = input.running_time() - use for time since powered on
//  possible messages:
//  microbots: mission start
//  microbots: mission stop
//  microbots: go to safety
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

input.onButtonPressed(Button.A, function on_button_pressed_a() {
    
    state = "SEARCHING_TAG"
})
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    
    state = "SEARCHING"
})
function A_goForwardStep() {
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
}

function stateLoop() {
    
    if (state == "WAITING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.WAITING)
        servos.P0.run(0)
        servos.P1.run(0)
    } else if (state == "MOVING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.MOVING)
        //  basic.show_leds("""
        //  . . # . .
        //  . # # . .
        //  # # # . .
        //  . . # . .
        //  . . # . .
        //  """)
        if (huskylens.readeBox(1, Content1.xCenter) > 200) {
            A_turnLeftStep()
        } else if (huskylens.readeBox(1, Content1.xCenter) < 120) {
            A_turnRightStep()
        } else {
            servos.P0.run(100)
            servos.P1.run(100)
            pause(500)
        }
        
        music.play(music.tonePlayable(392, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    } else if (state == "SEARCHING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.SEARCHING)
        //  basic.show_leds("""
        //  . . # . .
        //  . # . # .
        //  . # . # .
        //  . # . # .
        //  . . # . .
        //  """)
        servos.P0.run(40)
        servos.P1.run(-40)
        music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    } else if (state == "SEARCHING_TAG") {
        huskylens.initMode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)
        state = "SEARCHING"
    } else if (state == "FETCHING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.FETCHING)
        
    } else if (state == "CATCHING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.CATCHING)
        
    } else if (state == "DROPPING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.DROPPING)
        
    } else if (state == "STOPPED") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.STOPPED)
        
    } else if (state == "TO_SAFETY") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.TO_SAFETY)
        
    } else if (state == "MISSION_COMPLETED") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.MISSION_COMPLETED)
        
    }
    
}

function R_search() {
    A_turnLeftStep()
}

function A_camMoveZ() {
    servos.P2.setAngle(100)
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

let degrees = 0
let state = ""
let S_armsClosed = 0
let S_ballOnScreen = 0
let S_weCanCatch = 0
basic.showString("ON3-2")
basic.showLeds(`
    . . # # .
    # . . # .
    # # # # #
    # . . # .
    . . # # .
    `)
robotInit()
basic.forever(function on_forever() {
    readLoop()
    stateLoop()
})
