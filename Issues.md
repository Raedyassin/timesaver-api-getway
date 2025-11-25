# this is the Projects Issues i will solve it later

## 1 Soft Delete
### descriptoin
  When a user deletes their account (we are using softRemove() fro soft delete):
    deletedAt is set to the current timestamp
    The row remains in the database
    By default, find() queries ignore this row
    If the user tries to sign up again with the same email, two things can happen:
    - Your DB unique constraint fails (if email is @Column({ unique: true }))
        → because the old row still exists (we made this way)
    - Your system might allow duplicate emails if no constraint
        → can cause data conflicts

### why this problem come
  all entities is extends the BaseEntityProps with have DeleteDateColumn() with make soft delete that mean if we delete any thing by softRemove() in the app it will still in db but wil not show in query so if we use unique constrain for insert or create will make this Issues

### Effects
  1. when user is delete his account and resignup again the system will don't create this accoutn because this email is unique in database
  
## singup by email
### description
  when user is singup by his email and try to singup or login py google account the system is create a new user(this is the issues)