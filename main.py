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
        return (FRAME_H - self.y)*23
 
    def mark(self):
        huskylens.write_osd("X", self.x, self.y)
 
    def to_text(self):
        return "["+self.id+","+self.x+","+self.y+","+self.w+","+self.h+"]"
 
# FIXED: Initialize target_box AFTER Box class definition
target_box : Box = None
angle_start = -1
 
def robotInit():
    global S_armsClosed, state, target_box, angle_start
    #Initialize radio connectivity
    UTBBot.init_as_bot(UTBBotCode.TeamName.AMA_BOT)
    UTBBot.new_bot_status(UTBBotCode.BotStatus.WAITING)
    #Initialize camera
    huskylens.init_i2c()
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
    huskylens.clear_osd()
    A_close()
    S_armsClosed = 1
    A_camMoveZ(100)
    state = "WAITING"
    billy.voice_preset(BillyVoicePreset.LITTLE_ROBOT)
    target_box = None
    angle_start = -1
 
def on_in_background():
    UTBBot.emit_status()
    basic.pause(5000)
control.in_background(on_in_background)

def change_to_tag_mode():
    A_camMoveZ(90)
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)

def change_to_color_mode():
    A_camMoveZ(100)
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
 
def on_message_start_received():
    global state
    billy.say("Starting mission")
    state = "SEARCHING"
UTBBot.on_message_start_received(on_message_start_received)
 
def on_message_danger_received():
    global state
    billy.say("Returning to base")
    change_to_tag_mode()
    state = "TO_SAFETY"
UTBBot.on_message_danger_received(on_message_danger_received)
 
def on_message_stop_received():
    global state
    billy.say("Ending mission")
    change_to_tag_mode()
    state = "MISSION_COMPLETED"
UTBBot.on_message_stop_received(on_message_stop_received)
 
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
    return input.running_time() > rotation_time + 20000
 
def display_state():
    huskylens.write_osd(state, 10, 0)
 
def get_closest_box(red_id=1):
    
    huskylens.clear_osd()
    display_state()
    huskylens.request()  # Refresh data
    total = huskylens.get_box(HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK)
    huskylens.write_osd("Count: " + total, 10, 20)
    result = None
 
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
 
def readLoop():
    display_state()
    global degrees, state, target_box
    degrees = input.compass_heading()
    if degrees < 45:
        basic.show_arrow(ArrowNames.NORTH)
    elif degrees < 135:
        basic.show_arrow(ArrowNames.EAST)
    elif degrees < 225:
        basic.show_arrow(ArrowNames.SOUTH)
    elif degrees < 315:
        basic.show_arrow(ArrowNames.WEST)
    else:
        basic.show_arrow(ArrowNames.NORTH)
    
    
    if is_box_locked() and state=="SEARCHING":
        music.play(music.tone_playable(100, music.beat(BeatFraction.WHOLE)),
                            music.PlaybackMode.UNTIL_DONE)
        closest_box = get_closest_box()
        if closest_box:
            music.play(music.tone_playable(262, music.beat(BeatFraction.WHOLE)),
                    music.PlaybackMode.UNTIL_DONE)
            #huskylens.clear_osd()
            #total = huskylens.get_box(HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK)
            #huskylens.write_osd("Count: " + total, 20, 20)
            #huskylens.write_osd(closest_box.to_text(), 20, 40)
            #closest_box.mark()
            # Once closest box found:
            # 1. Set new Target Box
            # 2. Lock Target Box util collected/get
            target_box = closest_box
            lock_box(target_box.time_to_reach_box())
            state = "MOVING"
        else:
            state = "SEARCHING"
        # ROBOT COMMUNICATION
        # time = input.running_time() - use for time since powered on
        # possible messages:
        # microbots: mission start
        # microbots: mission stop
        # microbots: go to safety
    display_state()
 
            
def A_turnRightStep():
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(500)
    servos.P0.stop()
    servos.P1.stop()
 
def A_turnLeftStep():
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(500)
    servos.P0.stop()
    servos.P1.stop()
 
def on_button_pressed_a():
    global state
    state = "SEARCHING"
 
input.on_button_pressed(Button.A, on_button_pressed_a)
 
def on_button_pressed_b():
    on_message_danger_received()
input.on_button_pressed(Button.B, on_button_pressed_b)

def capture():
    global state, target_box, angle_start, rotation_time
    rotation_time = 0
            # basic.show_leds("""
            # . . # . .
            # . # # . .
            # # # # . .
            # . . # . .
            # . . # . .
            # """)
    if target_box:
        if(target_box.x > 200):
            A_turnRightStep()
        elif(target_box.x < 120):
            A_turnLeftStep()
        servos.P0.run(100)
        servos.P1.run(100)
        pause(target_box.time_to_reach_box())
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
def stateLoop():
    global state, target_box, angle_start, rotation_time
    if state == "WAITING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.WAITING)
        servos.P0.run(0)
        servos.P1.run(0)
    elif state == "MOVING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.MOVING)
        if(capture()):
            UTBBot.increment_collected_balls_count(1)
            state = "SEARCHING"
        #music.play(music.tone_playable(392, music.beat(BeatFraction.WHOLE)),
        #    music.PlaybackMode.UNTIL_DONE)
    elif state == "SEARCHING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.SEARCHING)
        if(rotation_time == 0):
            rotation_time = rotationStart()
        else:
            if(isRotationTimeout()):
                #A full turn performed -> move around
                rotation_time = 0
                servos.P0.run(100)
                servos.P1.run(100)
                pause(2000)
        # basic.show_leds("""
        # . . # . .
        # . # . # .
        # . # . # .
        # . # . # .
        # . . # . .
        # """)
        servos.P0.run(50)
        servos.P1.run(-50)
        #music.play(music.tone_playable(262, music.beat(BeatFraction.WHOLE)),
        #    music.PlaybackMode.UNTIL_DONE)
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
        if (capture()):
            servos.P0.run(0)
            servos.P1.run(0)
            pause(5000)
            change_to_color_mode()
            state = "SEARCHING"
        pass
    elif state == "MISSION_COMPLETED":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.MISSION_COMPLETED)
        if(capture()):
            servos.P0.run(0)
            servos.P1.run(0)
            state = "WAITING"
        pass
 
def R_search():
    A_turnLeftStep()
 
def A_camMoveZ(angle):
    servos.P2.set_angle(angle)
 
def A_close():
    global S_armsClosed
    # servos.P2.set_angle(90)
    # pins.servo_write_pin(AnalogPin.P8, 15)
    S_armsClosed = 1
 
def A_open():
    global S_armsClosed
    # servos.P2.set_angle(15)
    # pins.servo_write_pin(AnalogPin.P8, 90)
    S_armsClosed = 0
 
# _Main_
degrees = 0
state = ""
S_armsClosed = 0
S_ballOnScreen = 0
S_weCanCatch = 0
basic.show_string("ON3-2")
basic.show_leds("""
    . . # # .
    # . . # .
    # # # # #
    # . . # .
    . . # # .
    """)
robotInit()
 
def on_forever():
    readLoop()
    stateLoop()
basic.forever(on_forever)