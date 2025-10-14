//  Huskylens Frame width and Height
let [FRAME_W, FRAME_H] = [320, 240]
//  Global variable to store lock timestamp
let box_lock_time = 0
let LOCK_TTL = 5000
//  5 seconds in milliseconds
class Box {
    id: number
    x: number
    y: number
    w: number
    h: number
    constructor(id: number, x: number, y: number, w: number, h: number) {
        this.id = id
        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }
    
    public size() {
        return this.w * this.w + this.h * this.h
    }
    
    public mark() {
        huskylens.writeOSD("X", this.x, this.y)
    }
    
    public to_text(): string {
        return "[" + this.id + "," + this.x + "," + this.y + "," + this.w + "," + this.h + "]"
    }
    
}

//  FIXED: Initialize target_box AFTER Box class definition
let target_box : Box = null
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
    target_box = null
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
function lock_box() {
    /** Lock the box for 5 seconds */
    
    box_lock_time = input.runningTime()
}

function is_box_locked(): boolean {
    /** Return True if box is still locked, False otherwise */
    
    if (box_lock_time == 0) {
        return false
    }
    
    //  Never locked
    let elapsed = input.runningTime() - box_lock_time
    return elapsed < LOCK_TTL
}

function display_state() {
    huskylens.writeOSD(state, 10, 0)
}

function get_closest_box(red_id: number = 1): Box {
    let x: number;
    let y: number;
    let w: number;
    let h: number;
    let box: Box;
    huskylens.clearOSD()
    display_state()
    huskylens.request()
    //  Refresh data
    let total = huskylens.getBox(HUSKYLENSResultType_t.HUSKYLENSResultBlock)
    huskylens.writeOSD("Count: " + total, 10, 20)
    let result = null
    for (let i = 1; i < total + 1; i++) {
        //  Lire l'ID du bloc i
        // id_i = huskylens.reade_box(i, Content1.ID)
        // if id_i == red_id:
        huskylens.request()
        //  Refresh data
        x = huskylens.readeBox_index(1, i, Content1.xCenter)
        y = huskylens.readeBox_index(1, i, Content1.yCenter)
        w = huskylens.readeBox_index(1, i, Content1.width)
        h = huskylens.readeBox_index(1, i, Content1.height)
        box = new Box(i, x, y, w, h)
        huskylens.writeOSD(box.to_text(), 10, 20 + 20 * i)
        if (i === 1) {
            result = box
        } else if (result.y < box.y) {
            result = box
        }
        
    }
    if (result) {
        result.mark()
    }
    
    return result
}

function readLoop() {
    let closest_box: Box;
    display_state()
    
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
    
    if (!is_box_locked()) {
        closest_box = get_closest_box()
        if (closest_box) {
            // huskylens.clear_osd()
            // total = huskylens.get_box(HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK)
            // huskylens.write_osd("Count: " + total, 20, 20)
            // huskylens.write_osd(closest_box.to_text(), 20, 40)
            // closest_box.mark()
            //  Once closest box found:
            //  1. Set new Target Box
            //  2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box()
            state = "MOVING"
        } else {
            state = "SEARCHING"
        }
        
    }
    
    //  ROBOT COMMUNICATION
    //  time = input.running_time() - use for time since powered on
    //  possible messages:
    //  microbots: mission start
    //  microbots: mission stop
    //  microbots: go to safety
    display_state()
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
        if (target_box) {
            if (target_box.x > 200) {
                A_turnLeftStep()
            } else if (target_box.x < 120) {
                A_turnRightStep()
            } else {
                servos.P0.run(100)
                servos.P1.run(100)
                pause(500)
            }
            
        }
        
    } else if (state == "SEARCHING") {
        // music.play(music.tone_playable(392, music.beat(BeatFraction.WHOLE)),
        //     music.PlaybackMode.UNTIL_DONE)
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
    } else if (state == "SEARCHING_TAG") {
        // music.play(music.tone_playable(262, music.beat(BeatFraction.WHOLE)),
        //     music.PlaybackMode.UNTIL_DONE)
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

//  _Main_ 
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
