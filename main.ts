//  Huskylens Frame width and Height
let FRAME_W = 320
let FRAME_H = 240
//  Global variable to store lock timestamp
let box_lock_time = 0
let rotation_time = 0
let LOCK_TTL = 5000
//  5 seconds in milliseconds
//  Mesures
// # How many time (in sec) to crossed 100 cm
let TIME_TO_CROSS_100_CM_IN_MILISEC = 19000
//  secondes
// # How many seconds to rotate 360 degrees
let SEC_TO_ROTATE_360 = 5
//  Secondes
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
    
    public time_to_reach_box(): number {
        return (FRAME_H - this.y) * 24
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
function on_in_background() {
    UTBBot.emitStatus()
    basic.pause(5000)
    on_in_background()
}

control.inBackground(on_in_background)
function change_to_tag_mode() {
    A_camMoveZ(90)
    huskylens.initMode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)
}

function change_to_color_mode() {
    A_camMoveZ(100)
    huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
}

UTBBot.onMessageStartReceived(function on_message_start_received() {
    
    billy.say("Starting")
    state = "SEARCHING"
})
function on_message_danger_received() {
    
    billy.say("Returning")
    change_to_tag_mode()
    state = "TO_SAFETY"
}

UTBBot.onMessageDangerReceived(on_message_danger_received)
UTBBot.onMessageStopReceived(function on_message_stop_received() {
    
    billy.say("Ending")
    change_to_tag_mode()
    state = "MISSION_COMPLETED"
})
//  Lock box with Time To Leave: TTL
function lock_box(ttl: number) {
    /** Lock the box for 5 seconds */
    
    box_lock_time = input.runningTime() + ttl * 1000
}

function unlock_box() {
    /** Set to time Now */
    
    box_lock_time = input.runningTime()
}

function is_box_locked() {
    /** Return True if box is still locked, False otherwise */
    
    return input.runningTime() > box_lock_time
}

function rotationStart(): number {
    /** Setup rotation time */
    return input.runningTime()
}

function isRotationTimeout() {
    /** Return True if we have been rotating too long, False otherwise */
    
    return input.runningTime() > rotation_time + 20000
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
    
    if (is_box_locked() && (state == "SEARCHING" || state == "TO_SAFETY" || state == "MISSION_COMPLETED")) {
        //  music.play(music.tone_playable(100, music.beat(BeatFraction.WHOLE)),
        //  music.PlaybackMode.UNTIL_DONE)
        closest_box = get_closest_box()
        if (closest_box) {
            //  music.play(music.tone_playable(262, music.beat(BeatFraction.WHOLE)),
            //  music.PlaybackMode.UNTIL_DONE)
            // huskylens.clear_osd()
            // total = huskylens.get_box(HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK)
            // huskylens.write_osd("Count: " + total, 20, 20)
            // huskylens.write_osd(closest_box.to_text(), 20, 40)
            // closest_box.mark()
            //  Once closest box found:
            //  1. Set new Target Box
            //  2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
            state = "MOVING"
        }
        
    }
    
    //  else:
    //  state = "SEARCHING"
    //  time = input.running_time() - use for time since powered on
    display_state()
}

function A_turnRightStep() {
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(500)
    servos.P0.stop()
    servos.P1.stop()
}

function A_turnLeftStep() {
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(500)
    servos.P0.stop()
    servos.P1.stop()
}

input.onButtonPressed(Button.A, function on_button_pressed_a() {
    
    state = "SEARCHING"
})
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    on_message_danger_received()
})
function capture(): boolean {
    
    rotation_time = 0
    let base_offset = 0
    //  basic.show_leds("""
    //  . . # . .
    //  . # # . .
    //  # # # . .
    //  . . # . .
    //  . . # . .
    //  """)
    if (target_box) {
        if (target_box.x > 180) {
            A_turnRightStep()
        } else if (target_box.x < 140) {
            A_turnLeftStep()
        }
        
        servos.P0.run(100)
        servos.P1.run(100)
        if (state == "TO_SAFETY" || state == "MISSION_COMPLETED") {
            base_offset = 700
        }
        
        pause(target_box.time_to_reach_box() - base_offset)
        servos.P0.run(0)
        servos.P1.run(0)
        target_box = null
        unlock_box()
        return true
    }
    
    return false
}

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
        if (capture()) {
            UTBBot.incrementCollectedBallsCount(1)
            state = "SEARCHING"
        }
        
    } else if (state == "SEARCHING") {
        // music.play(music.tone_playable(392, music.beat(BeatFraction.WHOLE)),
        //     music.PlaybackMode.UNTIL_DONE)
        UTBBot.newBotStatus(UTBBotCode.BotStatus.SEARCHING)
        if (rotation_time == 0) {
            rotation_time = rotationStart()
        } else if (isRotationTimeout()) {
            // A full turn performed -> move around
            rotation_time = 0
            servos.P0.run(100)
            servos.P1.run(100)
            pause(2000)
        }
        
        //  basic.show_leds("""
        //  . . # . .
        //  . # . # .
        //  . # . # .
        //  . # . # .
        //  . . # . .
        //  """)
        servos.P0.run(40)
        servos.P1.run(-40)
    } else if (state == "FETCHING") {
        // music.play(music.tone_playable(262, music.beat(BeatFraction.WHOLE)),
        //     music.PlaybackMode.UNTIL_DONE)
        UTBBot.newBotStatus(UTBBotCode.BotStatus.FETCHING)
        
    } else if (state == "CATCHING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.CATCHING)
        
    } else if (state == "DROPPING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.DROPPING)
        
    } else if (state == "STOPPED") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.STOPPED)
        
    } else if (state == "TO_SAFETY") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.TO_SAFETY)
        if (rotation_time == 0) {
            rotation_time = rotationStart()
        } else if (isRotationTimeout()) {
            // A full turn performed -> move around
            rotation_time = 0
            servos.P0.run(100)
            servos.P1.run(100)
            pause(2000)
        }
        
        //  basic.show_leds("""
        //  . . # . .
        //  . # . # .
        //  . # . # .
        //  . # . # .
        //  . . # . .
        //  """)
        servos.P0.run(40)
        servos.P1.run(-40)
        if (capture()) {
            servos.P0.run(0)
            servos.P1.run(0)
            pause(5000)
            change_to_color_mode()
            state = "SEARCHING"
        }
        
    } else if (state == "MISSION_COMPLETED") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.MISSION_COMPLETED)
        if (rotation_time == 0) {
            rotation_time = rotationStart()
        } else if (isRotationTimeout()) {
            // A full turn performed -> move around
            rotation_time = 0
            servos.P0.run(100)
            servos.P1.run(100)
            pause(2000)
        }
        
        //  basic.show_leds("""
        //  . . # . .
        //  . # . # .
        //  . # . # .
        //  . # . # .
        //  . . # . .
        //  """)
        servos.P0.run(40)
        servos.P1.run(-40)
        if (capture()) {
            servos.P0.run(0)
            servos.P1.run(0)
            state = "WAITING"
        }
        
        
    }
    
}

function R_search() {
    A_turnLeftStep()
}

function A_camMoveZ(angle: number) {
    servos.P2.setAngle(angle)
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
basic.showString(control.deviceName())
// Initialize radio connectivity
UTBBot.initAsBot(UTBBotCode.TeamName.AmaBot)
UTBBot.newBotStatus(UTBBotCode.BotStatus.WAITING)
UTBBot.emitHeartBeat()
basic.showLeds(`
    . . # # .
    # . . # .
    # # # # #
    # . . # .
    . . # # .
    `)
//  global S_armsClosed, state, target_box, angle_start
// Initialize camera
huskylens.initI2c()
huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
huskylens.clearOSD()
A_close()
S_armsClosed = 1
A_camMoveZ(100)
state = "WAITING"
billy.voicePreset(BillyVoicePreset.LittleRobot)
target_box = null
let angle_start = -1
basic.forever(function on_forever() {
    readLoop()
    stateLoop()
})
control.inBackground(function melody() {
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    pause(70)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.B4, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp4, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    pause(100)
    music.play(music.tonePlayable(Note.Bb4, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.GSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    pause(70)
    music.play(music.tonePlayable(Note.E5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.Eb5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.B4, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    pause(70)
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    pause(70)
    music.play(music.tonePlayable(Note.Bb4, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.B4, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp4, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    pause(120)
    music.play(music.tonePlayable(Note.A4, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.B4, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.D5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.E5, music.beat(BeatFraction.Double)), music.PlaybackMode.UntilDone)
    pause(100)
})
