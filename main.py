# Huskylens Frame width and Height
FRAME_W = 320
FRAME_H = 240

# Global variable to store lock timestamp
box_lock_time = 0
rotation_time = 0
LOCK_TTL = 5000  # 5 seconds in milliseconds
 
# Mesures
## How many time (in sec) to crossed 100 cm
TIME_TO_CROSS_100_CM_IN_MILISEC = 19000 # secondes
 
## How many seconds to rotate 360 degrees
SEC_TO_ROTATE_360 = 5 # Secondes

COLOR_CAMERA_DEGREES = 100
TAG_CAMERA_DEGREES = 90
 
 
class Box:
    def __init__(self, id, x, y, w, h):
        self.id = id
        self.x = x
        self.y = y
        self.w = w
        self.h = h
 
    def size(self):
        return self.w * self.w + self.h * self.h
 
    def time_to_reach_box(self):
        advanceTime = (FRAME_H - self.y)*22
        if(advanceTime < 2000):
            advanceTime = 2000
        return advanceTime

    def mark(self):
        # huskylens.write_osd("X", self.x, self.y)
        pass
 
    def to_text(self):
        return "["+self.id+","+self.x+","+self.y+","+self.w+","+self.h+"]"

# FIXED: Initialize target_box AFTER Box class definition
target_box : Box = None

def on_in_background():
    UTBBot.emit_status()
    # music.play(music.tone_playable(800, music.beat(BeatFraction.QUARTER)),
    #     music.PlaybackMode.UNTIL_DONE)
    basic.pause(5000)
    on_in_background()
control.in_background(on_in_background)

def change_to_tag_mode():
    A_camMoveZ(TAG_CAMERA_DEGREES)
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)

def change_to_color_mode():
    A_camMoveZ(COLOR_CAMERA_DEGREES)
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
 
def on_message_start():
    global state
    # billy.say("Starting")
    state = "SEARCHING"
    basic.show_icon(IconNames.HEART)
UTBBot.on_message_start_received(on_message_start)

def on_message_danger():
    global state
    # billy.say("Returning")
    change_to_tag_mode()
    state = "TO_SAFETY"
    basic.show_icon(IconNames.SKULL)
UTBBot.on_message_danger_received(on_message_danger)
 
def on_message_stop():
    global state
    # billy.say("Ending")
    change_to_tag_mode()
    state = "MISSION_COMPLETED"
    basic.show_icon(IconNames.HOUSE)
UTBBot.on_message_stop_received(on_message_stop)
 
# Lock box with Time To Leave: TTL
def lock_box(ttl):
    """Lock the box for 5 seconds"""
    global box_lock_time
    box_lock_time = input.running_time() + (ttl * 1000)

def unlock_box():
    """Set to time Now"""
    global box_lock_time
    box_lock_time = input.running_time()
  
def is_box_locked():
    """Return True if box is still locked, False otherwise"""
    global box_lock_time
    return input.running_time() > box_lock_time

def rotationStart():
    """Setup rotation time"""
    return input.running_time()
  
def isRotationTimeout():
    """Return True if we have been rotating too long, False otherwise"""
    global rotation_time
    return input.running_time() > rotation_time + 8000
 
def display_state():
    huskylens.write_osd(state, 10, 0)
    huskylens.write_osd('Collected: ' + UTBBot.get_collected_balls_count(), 200, 0)
 
def get_closest_box(red_id=1):
    
    # huskylens.clear_osd()
    # display_state()
    huskylens.request()  # Refresh data
    total = huskylens.get_box(HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK)
    huskylens.write_osd("Count: " + total, 10, 20)
    result = None
 
    huskylens.get_box(HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK)
    for i in range(1, total+1):
        # Lire l'ID du bloc i
        #id_i = huskylens.reade_box(i, Content1.ID)
        #if id_i == red_id:
        huskylens.request()  # Refresh data
        x = huskylens.readeBox_index(1, i, Content1.X_CENTER)
        y = huskylens.readeBox_index(1, i, Content1.Y_CENTER)
        w = huskylens.readeBox_index(1, i, Content1.WIDTH)
        h = huskylens.readeBox_index(1, i, Content1.HEIGHT)
        box = Box(i, x, y, w, h)
        huskylens.write_osd(box.to_text(), 10, 20+(20*i))
        if i is 1:
            result = box
        elif result.y < box.y:
            result = box
    if result:
        result.mark()
    return result
            
def A_turnRightStep():
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(200)
    servos.P0.stop()
    servos.P1.stop()
 
def A_turnLeftStep():
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(200)
    servos.P0.stop()
    servos.P1.stop()
 
def on_button_pressed_a():
    global state
    state = "SEARCHING"
input.on_button_pressed(Button.A, on_button_pressed_a)
 
def on_button_pressed_b():
    on_message_danger()
input.on_button_pressed(Button.B, on_button_pressed_b)

def capture():
    global target_box, rotation_time
    rotation_time = 0
    base_offset = 0

    if target_box:
        if(target_box.x > 180):
            A_turnRightStep()
        elif(target_box.x < 140):
            A_turnLeftStep()
        servos.P0.run(-100)
        servos.P1.run(-100)
        if(state == "TO_SAFETY" or state == "MISSION_COMPLETED"):
            base_offset = 700
        pause(target_box.time_to_reach_box()-base_offset)
        servos.P0.run(0)
        servos.P1.run(0)
        target_box = None
        unlock_box()
        return True
    return False

def A_goForwardStep():
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
def mainStateLoop():
    display_state()
    global state, target_box, rotation_time, initialWait

    if state == "WAITING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.WAITING)
        if(initialWait):
            initialWait = False
        else:
            servos.P0.run(0)
            servos.P1.run(0)
    elif state == "MOVING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.MOVING)
        if(capture()):
            UTBBot.increment_collected_balls_count(1)
            state = "SEARCHING"
    elif state == "SEARCHING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.SEARCHING)
        closest_box = get_closest_box()
        if closest_box:
            # Once closest box found:
            # 1. Set new Target Box
            # 2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
            state = "MOVING"
        if(rotation_time == 0):
            rotation_time = rotationStart()
        else:
            if(isRotationTimeout()):
                #A full turn performed -> move around
                rotation_time = 0
                servos.P0.run(60)
                servos.P1.run(60)
                
                pause(2000)
        servos.P0.run(-40)
        servos.P1.run(40)
    elif state == "FETCHING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.FETCHING)
        pass
    elif state == "CATCHING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.CATCHING)
        pass
    elif state == "DROPPING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.DROPPING)
        pass
    elif state == "STOPPED":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.STOPPED)
        pass
    elif state == "TO_SAFETY":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.TO_SAFETY)
        closest_box = get_closest_box()
        if closest_box:
            # Once closest box found:
            # 1. Set new Target Box
            # 2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
        if(rotation_time == 0):
            rotation_time = rotationStart()
        else:
            if(isRotationTimeout()):
                #A full turn performed -> move around
                rotation_time = 0
                servos.P0.run(100)
                servos.P1.run(100)
                pause(2000)
        servos.P0.run(-30)
        servos.P1.run(30)
        if (capture()):
            melodyShort()
            servos.P0.run(0)
            servos.P1.run(0)
            pause(5000)
            change_to_color_mode()
            state = "SEARCHING"
    elif state == "MISSION_COMPLETED":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.MISSION_COMPLETED)
        closest_box = get_closest_box()
        if closest_box:
            # Once closest box found:
            # 1. Set new Target Box
            # 2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
        if(rotation_time == 0):
            rotation_time = rotationStart()
        else:
            if(isRotationTimeout()):
                #A full turn performed -> move around
                rotation_time = 0
                servos.P0.run(100)
                servos.P1.run(100)
                pause(2000)
        servos.P0.run(40)
        servos.P1.run(-40)
        if(capture()):
            servos.P0.run(0)
            servos.P1.run(0)
            melodyShortEnd()
            state = "WAITING"
        pass
 
def R_search():
    A_turnLeftStep()
 
def A_camMoveZ(angle):
    servos.P2.set_angle(angle)
 
# _Main_
state = ""
S_ballOnScreen = 0
S_weCanCatch = 0
initialWait = True
# Radio
UTBBot.init_as_bot(UTBBotCode.TeamName.AMA_BOT)
# basic.show_string(control.device_name())
UTBBot.new_bot_status(UTBBotCode.BotStatus.WAITING)
basic.show_leds("""
    . # . # .
    . . . . .
    . # # # .
    . # . # .
    . # # # .
    """)
#Initialize camera
huskylens.init_i2c()
huskylens.init_mode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
huskylens.clear_osd()
A_camMoveZ(COLOR_CAMERA_DEGREES)
state = "WAITING"
billy.voice_preset(BillyVoicePreset.LITTLE_ROBOT)
target_box = None
 
def on_forever():
    mainStateLoop()
basic.forever(on_forever)

def melody():
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    pause(70)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.B4, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP4, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    pause(100)
    music.play(music.tone_playable(Note.BB4, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.GSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    pause(70)
    music.play(music.tone_playable(Note.E5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.EB5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.B4, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    pause(70)
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    pause(70)
    music.play(music.tone_playable(Note.BB4, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.B4, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP4, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    pause(120)
    music.play(music.tone_playable(Note.A4, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.B4, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.D5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.E5, music.beat(BeatFraction.DOUBLE)), music.PlaybackMode.UNTIL_DONE)
    pause(100)
# control.in_background(melody)

def melodyShort():
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    pause(70)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP5, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.B4, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.CSHARP5, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.FSHARP4, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
    pause(100)

def melodyShortEnd():
    music.play(music.tone_playable(Note.A4, music.beat(BeatFraction.HALF)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.B4, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.D5, music.beat(BeatFraction.QUARTER)), music.PlaybackMode.UNTIL_DONE)
    music.play(music.tone_playable(Note.E5, music.beat(BeatFraction.DOUBLE)), music.PlaybackMode.UNTIL_DONE)
    pause(100)