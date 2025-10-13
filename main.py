def robotInit():
    global S_armsClosed, state
    #Initialize radio connectivity
    UTBBot.init_as_bot(UTBBotCode.TeamName.AMA_BOT)
    UTBBot.new_bot_status(UTBBotCode.BotStatus.WAITING)
    #Initialize camera
    huskylens.init_i2c()
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
    huskylens.clear_osd()
    A_close()
    S_armsClosed = 1
    A_camMoveZ()
    state = "WAITING"
    billy.voice_preset(BillyVoicePreset.LITTLE_ROBOT)

def on_in_background():
    UTBBot.emit_status()
    basic.pause(5000)
control.in_background(on_in_background)

def on_message_start_received():
    global state
    billy.say("Starting mission")
    state = "SEARCHING"
UTBBot.on_message_start_received(on_message_start_received)

def on_message_danger_received():
    global state
    billy.say("Returning to base")
    state = "TO_SAFETY"
UTBBot.on_message_danger_received(on_message_danger_received)

def on_message_stop_received():
    billy.say("Ending mission")
UTBBot.on_message_stop_received(on_message_stop_received)

def readLoop():
    global degrees, state
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
    huskylens.request()
    if huskylens.is_learned(1):
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.X_CENTER)),
            20,
            20)
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.Y_CENTER)),
            20,
            50)
        if huskylens.is_appear(1, HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK):
            state = "MOVING"
        else:
            state = "SEARCHING"
    # ROBOT COMMUNICATION
    # time = input.running_time() - use for time since powered on
    # possible messages:
    # microbots: mission start
    # microbots: mission stop
    # microbots: go to safety

            
def A_turnRightStep():
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(10)
    servos.P0.stop()
    servos.P1.stop()
def A_turnLeftStep():
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()

def on_button_pressed_a():
    global state
    state = "SEARCHING_TAG"
input.on_button_pressed(Button.A, on_button_pressed_a)

def on_button_pressed_b():
    global state
    state = "SEARCHING"
input.on_button_pressed(Button.B, on_button_pressed_b)    

def A_goForwardStep():
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
def stateLoop():
    global state
    if state == "WAITING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.WAITING)
        servos.P0.run(0)
        servos.P1.run(0)
    elif state == "MOVING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.MOVING)
        # basic.show_leds("""
        # . . # . .
        # . # # . .
        # # # # . .
        # . . # . .
        # . . # . .
        # """)
        if(huskylens.reade_box(1, Content1.X_CENTER)>200):
            A_turnLeftStep()
        elif(huskylens.reade_box(1, Content1.X_CENTER)<120):
            A_turnRightStep()
        else:
            servos.P0.run(100)
            servos.P1.run(100)
            pause(500)
        music.play(music.tone_playable(392, music.beat(BeatFraction.WHOLE)),
            music.PlaybackMode.UNTIL_DONE)
    elif state == "SEARCHING":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.SEARCHING)
        # basic.show_leds("""
        # . . # . .
        # . # . # .
        # . # . # .
        # . # . # .
        # . . # . .
        # """)
        servos.P0.run(40)
        servos.P1.run(-40)
        music.play(music.tone_playable(262, music.beat(BeatFraction.WHOLE)),
            music.PlaybackMode.UNTIL_DONE)
    elif state == "SEARCHING_TAG":
        huskylens.init_mode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)
        state = "SEARCHING"
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
        pass
    elif state == "MISSION_COMPLETED":
        UTBBot.new_bot_status(UTBBotCode.BotStatus.MISSION_COMPLETED)
        pass
def R_search():
    A_turnLeftStep()
def A_camMoveZ():
    servos.P2.set_angle(100)
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
