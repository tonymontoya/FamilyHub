# Family Hub User Guide

A complete guide to using Family Hub for family organization.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Chores](#chores)
4. [Todos](#todos)
5. [Lists](#lists)
6. [Calendar](#calendar)
7. [Child Accounts](#child-accounts)
8. [Settings](#settings)

---

## Getting Started

### First-Time Setup

1. **Access Family Hub** at `http://your-server:3000`
2. **Create your family** by registering as a parent
3. **Add family members** (parents and children)
4. **Start organizing** with chores, todos, lists, and calendar events

### User Roles

| Role | Permissions |
|------|-------------|
| **Parent** | Full access: create, edit, delete everything, approve completions |
| **Child** | Complete assigned chores/todos, view calendar, earn points |

---

## Dashboard

The dashboard is your family's command center. It shows:

- **Today's Chores** - What needs to be done today
- **Overdue Items** - Chores and todos past their due date
- **Recent Completions** - What family members have completed
- **Points Summary** - Current points for each family member
- **Quick Actions** - Fast access to create new items

---

## Chores

### Creating a Chore (Parents Only)

1. Navigate to **Chores** from the sidebar
2. Click **"New Chore"**
3. Fill in details:
   - **Title** - Name of the chore
   - **Description** - Optional instructions
   - **Points** - Reward for completion
   - **Assignee** - Who should do it
   - **Recurrence** - How often it repeats (daily, weekly, etc.)
4. Click **Save**

### Completing a Chore

1. Find the chore in the list
2. Click the **checkbox** or **"Complete"** button
3. (Optional) Add a photo as proof
4. (Optional) Add notes
5. Submit for approval

### Approving a Completion (Parents Only)

1. Go to **Family → Approvals**
2. Review the completion (photo, notes)
3. Click **Approve** to award points, or **Decline** with feedback

---

## Todos

### Creating a Todo

1. Navigate to **Todos** from the sidebar
2. Click **"New Todo"**
3. Fill in:
   - **Title** - What needs to be done
   - **Notes** - Additional details
   - **Due Date** - When it's due
   - **Assignee** - Who's responsible
4. Click **Save**

### Managing Todos

- **Complete** - Check off when done
- **Edit** - Change details anytime
- **Delete** - Remove completed or cancelled todos

---

## Lists

Family Hub includes several list types:

### Shopping Lists
- Add items with quantities
- Check off items while shopping
- Reuse lists for regular shopping trips

### Packing Lists
- Create for trips or activities
- Assign items to family members
- Check off as items are packed

### Wishlists
- Kids can add desired items
- Parents can see for gift ideas
- Mark as received

### List Features
- **Drag & Drop** - Reorder items
- **Quantity** - Track how many needed
- **Notes** - Add details to items
- **Completion** - Check off as done

---

## Calendar

### Viewing the Calendar

1. Click **Calendar** in the sidebar
2. Use **Previous/Next** buttons to navigate months
3. Click **Today** to return to current month
4. Events are shown as colored blocks on each day

### Creating an Event

1. Click **"New Event"** or click any date
2. Fill event details:
   - **Title** - Event name (required)
   - **Description** - Optional details
   - **Date** - When it occurs
   - **Time** - Start time (optional)
   - **Location** - Where (optional)
   - **Type** - Event, Appointment, Activity, Birthday, etc.
   - **Color** - Visual distinction

3. **For Recurring Events:**
   - Check **"Repeats"**
   - Select frequency: Weekly, Daily
   - Set end date (optional)

4. **For Reminders:**
   - Click **"Add Reminder"**
   - Select when: 0 min, 5 min, 15 min, 30 min, 1 hour, 1 day before
   - Add multiple reminders if needed

5. Click **Save**

### Editing Events

1. Click on any event in the calendar
2. For **recurring events**, choose:
   - **This occurrence only** - Edit just this instance
   - **All occurrences** - Edit the entire series
3. Make changes
4. Click **Save**

### Canceling an Event

1. Click on the event
2. Select **"Cancel this occurrence"** (for one time) or delete (for all)
3. Confirm cancellation

### Rescheduling with Drag & Drop

1. **Click and hold** an event
2. **Drag** it to a new date
3. **Release** to reschedule

### Managing Reminders

#### Enabling Browser Notifications

1. Go to **Settings**
2. Find **"Browser Notifications"**
3. Click **Enable**
4. Allow when browser prompts

#### How Reminders Work

- Notifications appear at the set time before an event
- Click **"View"** to go to the event date
- Once acknowledged, reminders won't show again
- Works across all open tabs

#### Troubleshooting Notifications

**Not receiving notifications?**
- Check browser permission settings
- Ensure you're not in "Do Not Disturb" mode
- Try refreshing the page

---

## Child Accounts

### Creating a Child Account (Parents Only)

1. Go to **Family → Children**
2. Click **"Add Child"**
3. Fill in:
   - **Display Name** - How they'll appear
   - **Username** - For login
   - **Password** - Initial password
4. Click **Create**

### Child Login

Children log in at `http://your-server:3000/login/child`

1. Enter **Username**
2. Enter **Password**
3. Click **Sign In**

### What Children Can Do

- View their assigned chores and todos
- Mark chores complete (pending parent approval)
- View calendar events
- See their points
- Create wishlist items

### What Children Cannot Do

- Create or edit chores
- Approve completions
- Add other family members
- Access parent settings

---

## Settings

### Notification Settings

- **Browser Notifications** - Enable/disable popup notifications
- **Sound** - Play sound with reminders

### Display Settings

- **Theme** - Light/dark mode
- **Language** - (Future feature)

### Account Settings

- Change password
- Update profile
- Manage family members

---

## Tips & Best Practices

### For Parents

1. **Start Small** - Begin with a few chores, expand as family gets comfortable
2. **Be Consistent** - Regular approval of completions keeps kids motivated
3. **Use Points Meaningfully** - Connect points to rewards kids value
4. **Calendar Everything** - Put all family activities in the calendar
5. **Set Reminders** - Use 15-min reminders for important events

### For Kids

1. **Check Daily** - Look at chores and todos each morning
2. **Complete Promptly** - Do chores when assigned, don't wait
3. **Add Details** - Photos and notes help parents approve faster
4. **Save Points** - Work toward bigger rewards

### Family Organization Tips

1. **Weekly Planning** - Review calendar together on Sundays
2. **Recurring Chores** - Set up weekly chores (trash, laundry, etc.)
3. **Shopping Lists** - Keep a shared shopping list, add items as needed
4. **Event Reminders** - Set reminders for practices, appointments, birthdays

---

## Troubleshooting

### Can't Log In
- Check username/email spelling
- Reset password if forgotten
- Ensure account hasn't been deleted

### Events Not Showing
- Check you're looking at the correct month
- Verify event wasn't deleted
- Refresh the page

### Notifications Not Working
- Enable in Settings → Browser Notifications
- Check browser permission settings
- Some browsers block notifications in private/incognito mode

### App Seems Slow
- Check server resources (RAM, CPU)
- Restart Docker containers: `docker compose restart`
- Clear browser cache

---

## Getting Help

- **GitHub Issues:** Report bugs at [github.com/tonymontoya/FamilyHub/issues](https://github.com/tonymontoya/FamilyHub/issues)
- **GitHub Discussions:** Ask questions at [github.com/tonymontoya/FamilyHub/discussions](https://github.com/tonymontoya/FamilyHub/discussions)

---

**Happy organizing! 🏠**
