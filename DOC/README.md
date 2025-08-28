
# DESCRIPTION
This file is the root file for the documentation of the new approarch we want to explore.

## APPORACH
Refactor the code of the robot having 3 main parts:
 1. read-state: (eg. are the arms open?, is the robot moving? ...)
 2. make-action: (eg. open/close arms, move the robot)
 3. write-state: (update the current-status dashboard data/file)

NB. the current-status is a central point that stores the current state of the robot
