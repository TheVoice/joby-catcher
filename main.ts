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
let COLOR_CAMERA_DEGREES = 100
let TAG_CAMERA_DEGREES = 85
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
        let advanceTime = (FRAME_H - this.y) * 19
        if (advanceTime < 2000) {
            advanceTime = 2000
        }
        
        return advanceTime
    }
    
    public mark() {
        //  huskylens.write_osd("X", self.x, self.y)
        
    }
    
    public to_text(): string {
        return "[" + this.id + "," + this.x + "," + this.y + "," + this.w + "," + this.h + "]"
    }
    
}

//  FIXED: Initialize target_box AFTER Box class definition
let target_box : Box = null
function on_in_background() {
    UTBBot.emitStatus()
    //  music.play(music.tone_playable(800, music.beat(BeatFraction.QUARTER)),
    //      music.PlaybackMode.UNTIL_DONE)
    basic.pause(5000)
    on_in_background()
}

control.inBackground(on_in_background)
function change_to_tag_mode() {
    A_camMoveZ(TAG_CAMERA_DEGREES)
    huskylens.initMode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)
}

function change_to_color_mode() {
    A_camMoveZ(COLOR_CAMERA_DEGREES)
    huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
}

UTBBot.onMessageStartReceived(function on_message_start() {
    
    //  billy.say("Starting")
    state = "SEARCHING"
    basic.showIcon(IconNames.Heart)
})
function on_message_danger() {
    
    //  billy.say("Returning")
    change_to_tag_mode()
    state = "TO_SAFETY"
    basic.showIcon(IconNames.Skull)
}

UTBBot.onMessageDangerReceived(on_message_danger)
UTBBot.onMessageStopReceived(function on_message_stop() {
    
    //  billy.say("Ending")
    change_to_tag_mode()
    state = "MISSION_COMPLETED"
    basic.showIcon(IconNames.House)
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
    
    return input.runningTime() > rotation_time + 8000
}

function display_state() {
    huskylens.writeOSD(state, 10, 0)
    huskylens.writeOSD("Collected: " + UTBBot.getCollectedBallsCount(), 200, 0)
}

//  huskylens.write_osd("RotTime: "+ rotation_time, 100, 100)
function get_closest_box(red_id: number = 1): Box {
    let x: number;
    let y: number;
    let w: number;
    let h: number;
    let box: Box;
    //  huskylens.clear_osd()
    //  display_state()
    huskylens.request()
    //  Refresh data
    let total = huskylens.getBox(HUSKYLENSResultType_t.HUSKYLENSResultBlock)
    huskylens.writeOSD("Count: " + total, 10, 20)
    let result = null
    huskylens.getBox(HUSKYLENSResultType_t.HUSKYLENSResultBlock)
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

function A_turnRightStep() {
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(200)
    servos.P0.stop()
    servos.P1.stop()
}

function A_turnLeftStep() {
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(200)
    servos.P0.stop()
    servos.P1.stop()
}

input.onButtonPressed(Button.A, function on_button_pressed_a() {
    
    state = "SEARCHING"
})
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    on_message_danger()
})
function capture(): boolean {
    
    let base_offset = 0
    if (target_box) {
        if (target_box.x > 180) {
            A_turnRightStep()
        } else if (target_box.x < 140) {
            A_turnLeftStep()
        }
        
        servos.P0.run(-100)
        servos.P1.run(-100)
        if (state == "TO_SAFETY" || state == "MISSION_COMPLETED") {
            base_offset = 500
        }
        
        pause(target_box.time_to_reach_box() - base_offset)
        servos.P0.run(0)
        servos.P1.run(0)
        target_box = null
        unlock_box()
        rotation_time = 0
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

function mainStateLoop() {
    let closest_box: Box;
    display_state()
    
    if (state == "WAITING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.WAITING)
        if (initialWait) {
            initialWait = false
        } else {
            servos.P0.run(0)
            servos.P1.run(0)
        }
        
    } else if (state == "MOVING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.MOVING)
        if (capture()) {
            UTBBot.incrementCollectedBallsCount(1)
            state = "SEARCHING"
        }
        
    } else if (state == "SEARCHING") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.SEARCHING)
        closest_box = get_closest_box()
        if (closest_box) {
            //  Once closest box found:
            //  1. Set new Target Box
            //  2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
            state = "MOVING"
        }
        
        if (rotation_time == 0) {
            rotation_time = rotationStart()
        } else if (isRotationTimeout()) {
            // A full turn performed -> move around
            rotation_time = 0
            servos.P0.run(50)
            servos.P1.run(50)
            if (Math.randomBoolean()) {
                turnReverse = -1
            } else {
                turnReverse = 1
            }
            
            pause(1000)
        }
        
        servos.P0.run(-40 * turnReverse)
        servos.P1.run(40 * turnReverse)
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
        closest_box = get_closest_box()
        if (closest_box) {
            //  Once closest box found:
            //  1. Set new Target Box
            //  2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
        }
        
        if (rotation_time == 0) {
            //  music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
            rotation_time = rotationStart()
        } else if (isRotationTimeout()) {
            // A full turn performed -> move around
            rotation_time = 0
            servos.P0.run(-100)
            servos.P1.run(-100)
            pause(2000)
        }
        
        servos.P0.run(-40)
        servos.P1.run(40)
        if (capture()) {
            melodyShort()
            servos.P0.run(0)
            servos.P1.run(0)
            pause(5000)
            change_to_color_mode()
            state = "SEARCHING"
        }
        
    } else if (state == "MISSION_COMPLETED") {
        UTBBot.newBotStatus(UTBBotCode.BotStatus.MISSION_COMPLETED)
        closest_box = get_closest_box()
        if (closest_box) {
            //  Once closest box found:
            //  1. Set new Target Box
            //  2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
        }
        
        if (rotation_time == 0) {
            rotation_time = rotationStart()
        } else if (isRotationTimeout()) {
            //  music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
            // A full turn performed -> move around
            rotation_time = 0
            servos.P0.run(-100)
            servos.P1.run(-100)
            pause(2000)
        }
        
        servos.P0.run(40)
        servos.P1.run(-40)
        if (capture()) {
            servos.P0.run(0)
            servos.P1.run(0)
            melodyShortEnd()
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

//  _Main_
let turnReverse = 1
let state = ""
let S_ballOnScreen = 0
let S_weCanCatch = 0
let initialWait = true
//  Radio
UTBBot.initAsBot(UTBBotCode.TeamName.AmaBot)
//  basic.show_string(control.device_name())
UTBBot.newBotStatus(UTBBotCode.BotStatus.WAITING)
basic.showLeds(`
    . # . # .
    . . . . .
    . # # # .
    . # . # .
    . # # # .
    `)
// Initialize camera
huskylens.initI2c()
huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
huskylens.clearOSD()
A_camMoveZ(COLOR_CAMERA_DEGREES)
state = "WAITING"
billy.voicePreset(BillyVoicePreset.LittleRobot)
target_box = null
basic.forever(function on_forever() {
    mainStateLoop()
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
function melodyShort() {
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    pause(70)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp5, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.B4, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.CSharp5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.FSharp4, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    pause(100)
}

function melodyShortEnd() {
    music.play(music.tonePlayable(Note.A4, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.B4, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.D5, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
    music.play(music.tonePlayable(Note.E5, music.beat(BeatFraction.Double)), music.PlaybackMode.UntilDone)
    pause(100)
}

