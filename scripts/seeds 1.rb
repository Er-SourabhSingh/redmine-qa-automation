include Redmine::I18n
    models_to_clear = [
    Issue,
    Tracker,
    IssueStatus,
    Enumeration,
    TimeEntry,
    IssueQuery,
    TimeEntryQuery,
    ProjectQuery
    ]
    ActiveRecord::Base.connection.disable_referential_integrity do
        models_to_clear.each do |model|
            model.delete_all
        end
        Project.all.each do |project|
            project.delete
        end
        admin_user = User.find_by(login: 'admin')
        User.where.not(id: admin_user.id).delete_all
        non_member_role = Role.find_by(name: 'Non member')
        anonymous_role = Role.find_by(name: 'Anonymous')
        Role.where.not(id: [non_member_role.id, anonymous_role.id]).delete_all
        EmailAddress.where.not(id: admin_user.id).delete_all
        WorkflowRule.where(type: 'WorkflowTransition').delete_all
    end
    #Role
    manager = Role.create! :name => l(:default_role_manager),
                             :issues_visibility => 'all',
                             :users_visibility => 'all',
                             :position => 1
    manager.permissions = manager.setable_permissions.collect {|p| p.name}
    manager.save!
    developer =
        Role.create!(
          :name => l(:default_role_developer),
          :position => 2,
          :permissions => [
            :manage_versions,
            :manage_categories,
            :view_issues,
            :add_issues,
            :edit_issues,
            :view_private_notes,
            :set_notes_private,
            :manage_issue_relations,
            :manage_subtasks,
            :add_issue_notes,
            :save_queries,
            :view_gantt,
            :view_calendar,
            :log_time,
            :view_time_entries,
            :view_news,
            :comment_news,
            :view_documents,
            :view_wiki_pages,
            :view_wiki_edits,
            :edit_wiki_pages,
            :delete_wiki_pages,
            :view_messages,
            :add_messages,
            :edit_own_messages,
            :view_files,
            :manage_files,
            :browse_repository,
            :view_changesets,
            :commit_access,
            :manage_related_issues
          ]
        )
        employee =
        Role.create!(
          :name => "Employee",
          :position => 2,
          :permissions => [
            :manage_versions,
            :manage_categories,
            :view_issues,
            :add_issues,
            :edit_issues,
            :view_private_notes,
            :set_notes_private,
            :manage_issue_relations,
            :manage_subtasks,
            :add_issue_notes,
            :save_queries,
            :view_gantt,
            :view_calendar,
            :log_time,
            :view_time_entries,
            :view_news,
            :comment_news,
            :view_documents,
            :view_wiki_pages,
            :view_wiki_edits,
            :edit_wiki_pages,
            :delete_wiki_pages,
            :view_messages,
            :add_messages,
            :edit_own_messages,
            :view_files,
            :manage_files,
            :browse_repository,
            :view_changesets,
            :commit_access,
            :manage_related_issues
          ]
        )
      client =
        Role.create!(
          :name => "Client",
          :position => 3,
          :permissions => [
            :view_issues,
            :add_issues,
            :add_issue_notes,
            :save_queries,
            :view_gantt,
            :view_calendar,
            :log_time,
            :view_time_entries,
            :view_news,
            :comment_news,
            :view_documents,
            :view_wiki_pages,
            :view_wiki_edits,
            :view_messages,
            :add_messages,
            :edit_own_messages,
            :view_files,
            :browse_repository,
            :view_changesets
          ]
        )

        # Project Lead Role
        project_lead = Role.create!(
          name: "Project Lead",
          position: 4,
          permissions: [
            :manage_versions,
            :manage_categories,
            :view_issues,
            :add_issues,
            :edit_issues,
            :manage_issue_relations,
            :manage_subtasks,
            :add_issue_notes,
            :save_queries,
            :view_gantt,
            :view_calendar,
            :log_time,
            :view_time_entries,
            :view_news,
            :comment_news,
            :view_documents,
            :view_wiki_pages,
            :view_wiki_edits,
            :edit_wiki_pages,
            :delete_wiki_pages,
            :view_messages,
            :add_messages,
            :edit_own_messages,
            :view_files,
            :manage_files,
            :browse_repository,
            :view_changesets,
            :commit_access,
            :manage_related_issues,
            :manage_members,
            :manage_project_activities
          ]
        )

        # QA Role
        qa_tester = Role.create!(
          name: "QA",
          position: 5,
          permissions: [
            :view_issues,
            :add_issues,
            :edit_issues,
            :manage_issue_relations,
            :manage_subtasks,
            :add_issue_notes,
            :save_queries,
            :view_gantt,
            :view_calendar,
            :log_time,
            :view_time_entries,
            :view_documents,
            :view_news,
            :comment_news,
            :view_wiki_pages,
            :view_wiki_edits,
            :edit_wiki_pages,
            :view_messages,
            :add_messages,
            :edit_own_messages,
            :view_files,
            :browse_repository,
            :view_changesets
          ]
        )

        # Team Lead Role
        team_lead = Role.create!(
          name: "Team Lead",
          position: 6,
          permissions: [
            :manage_versions,
            :manage_categories,
            :view_issues,
            :add_issues,
            :edit_issues,
            :manage_issue_relations,
            :manage_subtasks,
            :add_issue_notes,
            :view_private_notes,
            :set_notes_private,
            :save_queries,
            :view_gantt,
            :view_calendar,
            :log_time,
            :view_time_entries,
            :view_news,
            :comment_news,
            :view_documents,
            :view_wiki_pages,
            :view_wiki_edits,
            :edit_wiki_pages,
            :delete_wiki_pages,
            :view_messages,
            :add_messages,
            :edit_own_messages,
            :view_files,
            :manage_files,
            :browse_repository,
            :view_changesets,
            :commit_access,
            :manage_related_issues,
            :manage_members
          ]
        )

    Role.non_member.update_attribute :permissions, [:view_issues,
                                                      :add_issues,
                                                      :add_issue_notes,
                                                      :save_queries,
                                                      :view_gantt,
                                                      :view_calendar,
                                                      :view_time_entries,
                                                      :view_news,
                                                      :comment_news,
                                                      :view_documents,
                                                      :view_wiki_pages,
                                                      :view_wiki_edits,
                                                      :view_messages,
                                                      :add_messages,
                                                      :view_files,
                                                      :browse_repository,
                                                      :view_changesets]
  
      Role.anonymous.update_attribute :permissions, [:view_issues,
                                                     :view_gantt,
                                                     :view_calendar,
                                                     :view_time_entries,
                                                     :view_news,
                                                     :view_documents,
                                                     :view_wiki_pages,
                                                     :view_wiki_edits,
                                                     :view_messages,
                                                     :view_files,
                                                     :browse_repository,
                                                     :view_changesets]

    # Enumerations
    priority1 = IssuePriority.create!(:name => l(:default_priority_low), :position => 1)
    priority2 = IssuePriority.create!(:name => l(:default_priority_normal), :position => 2, :is_default => true)
    priority3 = IssuePriority.create!(:name => l(:default_priority_high), :position => 3)
    priority4 = IssuePriority.create!(:name => l(:default_priority_urgent), :position => 4)
    IssuePriority.create!(:name => l(:default_priority_immediate), :position => 5)
    #Document Category
    DocumentCategory.create!(:name => l(:default_doc_category_user), :position => 1)
    DocumentCategory.create!(:name => l(:default_doc_category_tech), :position => 2)
    #TimeEntryActivity
    TimeEntryActivity.create!(:name => l(:default_activity_design), :position => 1)
    TimeEntryActivity.create!(:name => l(:default_activity_development), :position => 2)
    # Issue queries
    IssueQuery.create!(
      :name => l(:label_assigned_to_me_issues),
      :filters =>
        {
          'status_id' => {:operator => 'o', :values => ['']},
          'assigned_to_id' => {:operator => '=', :values => ['me']},
          'project.status' => {:operator => '=', :values => ['1']}
        },
      :sort_criteria => [['priority', 'desc'], ['updated_on', 'desc']],
      :visibility => Query::VISIBILITY_PUBLIC
    )
    IssueQuery.create!(
      :name => l(:label_reported_issues),
      :filters =>
        {
          'status_id' => {:operator => 'o', :values => ['']},
          'author_id' => {:operator => '=', :values => ['me']},
          'project.status' => {:operator => '=', :values => ['1']}
        },
      :sort_criteria => [['updated_on', 'desc']],
      :visibility => Query::VISIBILITY_PUBLIC
    )
    IssueQuery.create!(
      :name => l(:label_updated_issues),
      :filters =>
        {
          'status_id' => {:operator => 'o', :values => ['']},
          'updated_by' => {:operator => '=', :values => ['me']},
          'project.status' => {:operator => '=', :values => ['1']}
        },
      :sort_criteria => [['updated_on', 'desc']],
      :visibility => Query::VISIBILITY_PUBLIC
    )
    IssueQuery.create!(
      :name => l(:label_watched_issues),
      :filters =>
        {
          'status_id' => {:operator => 'o', :values => ['']},
          'watcher_id' => {:operator => '=', :values => ['me']},
          'project.status' => {:operator => '=', :values => ['1']}
        },
      :sort_criteria => [['updated_on', 'desc']],
      :visibility => Query::VISIBILITY_PUBLIC
    )
    # Project queries
    ProjectQuery.create!(
      :name => l(:label_my_projects),
      :filters =>
        {
          'status' => {:operator => '=', :values => ['1']},
          'id' => {:operator => '=', :values => ['mine']}
        },
      :visibility => Query::VISIBILITY_PUBLIC
    )
    ProjectQuery.create!(
      :name => l(:label_my_bookmarks),
      :filters =>
        {
          'status' => {:operator => '=', :values => ['1']},
          'id' => {:operator => '=', :values => ['bookmarks']}
        },
      :visibility => Query::VISIBILITY_PUBLIC
    )

    # Time entry queries
    TimeEntryQuery.create!(
      :name => l(:label_spent_time),
      :filters =>
        {
          'spent_on' => {:operator => '*', :values => ['']},
          'user_id' => {:operator => '=', :values => ['me']}
        },
      :sort_criteria => [['spent_on', 'desc']],
      :options => {:totalable_names => [:hours]},
      :visibility => Query::VISIBILITY_PUBLIC
    )
   # Issue statuses
   new       = IssueStatus.create!(:name => l(:default_issue_status_new), :is_closed => false, :position => 1)
   in_progress  = IssueStatus.create!(:name => l(:default_issue_status_in_progress), :is_closed => false, :position => 2)
   resolved  = IssueStatus.create!(:name => l(:default_issue_status_resolved), :is_closed => false, :position => 3)
   feedback  = IssueStatus.create!(:name => l(:default_issue_status_feedback), :is_closed => false, :position => 4)
   closed    = IssueStatus.create!(:name => l(:default_issue_status_closed), :is_closed => true, :position => 5)
   rejected  = IssueStatus.create!(:name => l(:default_issue_status_rejected), :is_closed => true, :position => 6)

    #Trackers
    bug = Tracker.create!(:name => l(:default_tracker_bug), :default_status_id => new.id, :is_in_roadmap => false, :position => 1)
    feature = Tracker.create!(:name => l(:default_tracker_feature), :default_status_id => new.id, :is_in_roadmap => true, :position => 2)
    support = Tracker.create!(:name => l(:default_tracker_support), :default_status_id => new.id, :is_in_roadmap => false, :position => 3)
    
    #Deafult tracker for setting
    Setting.default_projects_tracker_ids = [
      bug.id.to_s,
      feature.id.to_s,
      support.id.to_s
    ]

    #WORKFLOW Tranistion
    manager_transitions = IssueStatus.all.to_a.product(IssueStatus.all.to_a) - IssueStatus.all.to_a.map { |status| [status, status] }
    developer_transitions = [
      [new, in_progress], [new, resolved], [new, feedback],
      [in_progress, resolved], [in_progress, feedback], [in_progress, closed],
      [resolved, feedback], [resolved, closed], [feedback, in_progress], [feedback, closed]
    ]
    employee_transitions = [
      [new, in_progress], [in_progress, resolved], [resolved, closed],
      [feedback, in_progress], [resolved, feedback]
    ]
    client_transitions = [
      [new, feedback], [in_progress, feedback], [resolved, feedback],
      [feedback, closed]
    ]
    ActiveRecord::Base.transaction do
      Tracker.find_each do |tracker|
        manager_transitions.each do |os, ns|
          WorkflowTransition.create!(
            tracker_id: tracker.id, role_id: manager.id,
            old_status_id: os.id, new_status_id: ns.id
          )
        end
        developer_transitions.each do |os, ns|
          WorkflowTransition.create!(
            tracker_id: tracker.id, role_id: developer.id,
            old_status_id: os.id, new_status_id: ns.id
          )
        end
        employee_transitions.each do |os, ns|
          WorkflowTransition.create!(
            tracker_id: tracker.id, role_id: employee.id,
            old_status_id: os.id, new_status_id: ns.id
          )
        end
        client_transitions.each do |os, ns|
          WorkflowTransition.create!(
            tracker_id: tracker.id, role_id: client.id,
            old_status_id: os.id, new_status_id: ns.id
          )
        end
      end
    end
    #users
    admin_user = User.find_by(login: 'admin') || User.create!(login: "admin", firstname: "Redmine", lastname: "Admin", admin: true, password: "12345678", mail: "admin@example.net")

    new_user1 = User.create!(login: "luna.blossom", firstname: "Luna", lastname: "Blossom", admin: false, password: "12345678", mail: "luna.blossom@zehntech.com",language: 'en',auth_source_id: nil)
    new_user2 = User.create!(login: "daisy.skye", firstname: "Daisy", lastname: "Skye", admin: false, password: "12345678",mail: "daisy.skye@zehntech.com",language: 'en',auth_source_id: nil)
    new_user3 = User.create!(login: "autumn.grace", firstname: "Autumn", lastname: "Grace", admin: false, password: "12345678",mail: "autumn.grace@zehntech.com",language: 'en',auth_source_id: nil)
    new_user4 = User.create!(login: "willow.belle", firstname: "Willow", lastname: "Belle", admin: false, password: "12345678",mail: "willow.belle@zehntech.com",language: 'en',auth_source_id: nil)
    new_user5 = User.create!(login: "harmony.rose", firstname: "Harmony", lastname: "Rose", admin: false, password: "12345678", mail: "harmony.rose@zehntech.com",language: 'en',auth_source_id: nil)
    new_user6 = User.create!(login: "summer.rain", firstname: "Summer", lastname: "Rain", admin: false , password: "12345678", mail: "summer.rain@zehntech.com",language: 'en',auth_source_id: nil)
    new_user7 = User.create!(login: "violet.ember", firstname: "Violet", lastname: "Ember", admin: false, password: "12345678", mail: "violet.ember@zehntech.com",language: 'en',auth_source_id: nil )
    new_user8 = User.create!(login: "celeste.dawn", firstname: "Celeste", lastname: "Dawn", admin: false, password: "12345678", mail: "celeste.dawn@zehntech.com",language: 'en',auth_source_id: nil)
    new_user9 = User.create!(login: "serenity.bloom", firstname: "Serenity", lastname: "Bloom", admin: false, password: "12345678", mail: "serenity.bloom@zehntech.com",language: 'en',auth_source_id: nil )
    new_user10 = User.create!(login: "nova.starling", firstname: "Nova", lastname: "Starling", admin: false, password: "12345678", mail: "nova.starling@zehntech.com",language: 'en',auth_source_id: nil)
    new_user11 = User.create!(login: "aurora.wren", firstname: "Aurora", lastname: "Wren", admin: false, password: "12345678", mail: "aurora.wren@zehntech.com", language: 'en', auth_source_id: nil)
    new_user12 = User.create!(login: "ivy.skylark", firstname: "Ivy", lastname: "Skylark", admin: false, password: "12345678", mail: "ivy.skylark@zehntech.com", language: 'en', auth_source_id: nil)
    new_user13 = User.create!(login: "luna.meadow", firstname: "Luna", lastname: "Meadow", admin: false, password: "12345678", mail: "luna.meadow@zehntech.com", language: 'en', auth_source_id: nil)
    new_user14 = User.create!(login: "sage.willow", firstname: "Sage", lastname: "Willow", admin: false, password: "12345678", mail: "sage.willow@zehntech.com", language: 'en', auth_source_id: nil)
    new_user15 = User.create!(login: "marigold.rayne", firstname: "Marigold", lastname: "Rayne", admin: false, password: "12345678", mail: "marigold.rayne@zehntech.com", language: 'en', auth_source_id: nil)
    new_user16 = User.create!(login: "ember.lilac", firstname: "Ember", lastname: "Lilac", admin: false, password: "12345678", mail: "ember.lilac@zehntech.com", language: 'en', auth_source_id: nil)
    new_user17 = User.create!(login: "opal.sparrow", firstname: "Opal", lastname: "Sparrow", admin: false, password: "12345678", mail: "opal.sparrow@zehntech.com", language: 'en', auth_source_id: nil)
    new_user18 = User.create!(login: "briar.sunset", firstname: "Briar", lastname: "Sunset", admin: false, password: "12345678", mail: "briar.sunset@zehntech.com", language: 'en', auth_source_id: nil)
    new_user19 = User.create!(login: "selene.frost", firstname: "Selene", lastname: "Frost", admin: false, password: "12345678", mail: "selene.frost@zehntech.com", language: 'en', auth_source_id: nil)
    new_user20 = User.create!(login: "isla.moon", firstname: "Isla", lastname: "Moon", admin: false, password: "12345678", mail: "isla.moon@zehntech.com", language: 'en', auth_source_id: nil)


    members_and_roles = [
      { user: admin_user, roles: [manager] },
      {user: new_user1, roles: [developer]},
      {user: new_user2, roles: [developer]},
      {user: new_user3, roles: [developer]},
      {user: new_user4, roles: [developer]},
      {user: new_user5, roles: [developer]},
      { user: new_user6, roles: [developer] },
      { user: new_user7, roles: [developer] },
      { user: new_user8, roles: [developer] },
      { user: new_user9, roles: [developer] },
      { user: new_user10, roles: [developer] },
      { user: new_user11, roles: [developer] },
      { user: new_user12, roles: [developer] },
      { user: new_user13, roles: [developer] },
      { user: new_user14, roles: [developer] },
      { user: new_user15, roles: [developer] },
      { user: new_user16, roles: [developer] },
      { user: new_user17, roles: [developer] },
      { user: new_user18, roles: [developer] },
      { user: new_user19, roles: [developer] },
      { user: new_user20, roles: [developer] }
    ]
    #projects

    def random_middle_dates
      current_month_start = Date.today.beginning_of_month
      current_month_end = Date.today.end_of_month
      middle_start = current_month_start + 10 # Start from the 10th day of the month
      middle_end = current_month_end - 10    # End 10 days before the month's end
    
      start_date = rand(middle_start..middle_end)
      end_date = rand((start_date + 1)..middle_end) # Ensure end_date is after start_date
      [start_date, end_date]
    end
    start_date1, end_date1 = random_middle_dates
    start_date2, end_date2 = random_middle_dates
    start_date3, end_date3 = random_middle_dates
    start_date4, end_date4 = random_middle_dates
    start_date5, end_date5 = random_middle_dates

    project1 = Project.create!(name: "Software development5", identifier: "defaultsd")
    project2 = Project.create!(name: "Mobile app development1", identifier: "mobileappdev")
    project3 = Project.create!(name: "HR management2", identifier: "hrmngmt")
    project4 = Project.create!(name: "Education and training3", identifier: "edandt")
    project5 = Project.create!(name: "Marketing campaign4", identifier: "markcamgn")
    project6 = Project.create!(name: "MVP build for PaySheet Application", identifier: "mvpbuild")
    project7 = Project.create!(name: "Agile Board Project", identifier: "agileboard")
    project8 = Project.create!(name: "Flux Gantt Project", identifier: "fluxganttproject")
    project9 = Project.create!(name: "Helpdesk Service Desk", identifier: "helpdesk")


    members_and_roles.each do |member_info|
      project1.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project2.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project3.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project4.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project5.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project6.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project7.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project8.members << Member.new(user: member_info[:user], roles: member_info[:roles])
      project9.members << Member.new(user: member_info[:user], roles: member_info[:roles])
    end
    project6.save!

    current_month_end = Date.today.end_of_month


    version1 = Version.create!(name: "Version 1", project: project8, effective_date: current_month_end, description: "Version 1 description" ,created_on: Date.today, updated_on: Date.today )
    version2 = Version.create!(name: "Version 2", project: project8, effective_date: current_month_end, description: "Version 2 description" ,created_on: Date.today, updated_on: Date.today )
    version3 = Version.create!(name: "Version 3", project: project8, effective_date: current_month_end, description: "Version 3 description" ,created_on: Date.today, updated_on: Date.today )
    version4 = Version.create!(name: "Version 4", project: project8, effective_date: current_month_end, description: "Version 4 description" ,created_on: Date.today, updated_on: Date.today )
    version5 = Version.create!(name: "Version 5", project: project7, effective_date: current_month_end, description: "Version 5 description" ,created_on: Date.today, updated_on: Date.today )
    version6 = Version.create!(name: "Version 6", project: project7, effective_date: current_month_end, description: "Version 6 description" ,created_on: Date.today, updated_on: Date.today )
    
    if Redmine::Plugin.installed?(:agile_board)
      
    project7.enabled_module_names = (project7.enabled_module_names + ['agile_board']).uniq
    project7.save!

    current_month_start = Date.today.beginning_of_month
    sprint_1_start_date = current_month_start
    sprint_1_end_date = current_month_start + 10
    sprint_2_start_date = current_month_start + 11
    sprint_2_end_date = current_month_start + 20

    sprint1 = SprintCraft.create!(name: "Bug Bash", project: project7, start_date: sprint_1_start_date, end_date: sprint_1_end_date , sharing: "not_shared" ,status: "open")
    sprint2 = SprintCraft.create!(name: "UI Polish", project: project7, start_date: sprint_2_start_date, end_date: sprint_2_end_date, sharing: "not_shared" ,status: "open")

    issue301 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement login form", tracker: bug, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today, sprint_craft: sprint1 ) 
    issue302 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Implement search functionality", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today, sprint_craft: sprint1)
    issue303 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Implement user account", tracker: support, status: feedback, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today, sprint_craft: sprint2)
    issue304 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Implement issues form", tracker: bug, status: in_progress, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today, sprint_craft: sprint2)
    
    end


    # Issues

      issue1 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement login form", tracker: bug, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today) 
      issue2 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Implement search functionality", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue3 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Implement user account", tracker: support, status: feedback, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue4 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Implement issues form", tracker: bug, status: in_progress, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue5 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement time log modal", tracker: bug, status: resolved, author: new_user3, assigned_to_id: new_user8.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue6 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Implement workload dashboard", tracker: bug, status: in_progress, author: new_user3, assigned_to_id: new_user8.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue7 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Implement new timesheet modal", tracker: feature, status: in_progress, author: new_user4, assigned_to_id: new_user7.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue8 = Issue.create!(project_id: project2.id, priority_id: priority3.id, subject: "Implement update timesheet modal", tracker: support, status: feedback, author: new_user4, assigned_to_id: new_user7.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue9 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "To check login form", tracker: bug, status: in_progress, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue10 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "To check the project search", tracker: bug, status: resolved, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue11 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Create user account", tracker: bug, status: resolved, author: new_user6, assigned_to_id: new_user1.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue12 = Issue.create!(project_id: project3.id, priority_id: priority2.id, subject: "Design a new issue modal", tracker: bug, status: in_progress, author: new_user6, assigned_to_id: new_user1.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue13 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "All the projects should appear in project search", tracker: support, status: feedback, author: new_user7, assigned_to_id: new_user2.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue14 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "The project should be visible in issues", tracker: feature, status: in_progress, author: new_user7, assigned_to_id: new_user2.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue15 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "The issue should be created with a project", tracker: bug, status: resolved, author: new_user8, assigned_to_id: new_user3.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue16 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Project id should appear in issues", tracker: bug, status: in_progress, author: new_user8, assigned_to_id: new_user3.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue17 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Project name should be added with project id", tracker: support, status: feedback, author: new_user9, assigned_to_id: new_user4.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue18 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Project name should appear in issues", tracker: feature, status: in_progress, author: new_user9, assigned_to_id: new_user4.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue19 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "To implement project name", tracker: bug, status: resolved, author: new_user10, assigned_to_id: new_user5.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue20 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Implement project search", tracker: bug, status: in_progress, author: new_user10, assigned_to_id: new_user5.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue21 = Issue.create!(project_id: project5.id, priority_id: priority2.id, subject: "Check new issues form", tracker: bug, status: resolved, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue22 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "To check the login form", tracker: support, status: feedback, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue23 = Issue.create!(project_id: project5.id, priority_id: priority4.id, subject: "Check the project search", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue24 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Dummy issue for testing", tracker: bug, status: new, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue25 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Testing issue for create", tracker: bug, status: new, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue45 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement OAuth login integration", tracker: bug, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today) 
      issue46 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Develop elasticsearch integration", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue47 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Implement user profile management", tracker: support, status: feedback, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue48 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Redesign issue creation workflow", tracker: bug, status: in_progress, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue49 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement time tracking reports", tracker: bug, status: resolved, author: new_user3, assigned_to_id: new_user8.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue50 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Build team workload analytics", tracker: bug, status: in_progress, author: new_user3, assigned_to_id: new_user8.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue51 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Redesign timesheet entry interface", tracker: feature, status: in_progress, author: new_user4, assigned_to_id: new_user7.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue52 = Issue.create!(project_id: project2.id, priority_id: priority3.id, subject: "Implement timesheet approval workflow", tracker: support, status: feedback, author: new_user4, assigned_to_id: new_user7.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue53 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Security audit for login system", tracker: bug, status: in_progress, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue54 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Optimize project search performance", tracker: bug, status: resolved, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue55 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Implement user account verification", tracker: bug, status: resolved, author: new_user6, assigned_to_id: new_user1.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue56 = Issue.create!(project_id: project3.id, priority_id: priority2.id, subject: "Design responsive issue modal", tracker: bug, status: in_progress, author: new_user6, assigned_to_id: new_user1.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue57 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "Implement project search filters", tracker: support, status: feedback, author: new_user7, assigned_to_id: new_user2.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue58 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "Add project visibility controls", tracker: feature, status: in_progress, author: new_user7, assigned_to_id: new_user2.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue59 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Validate project assignment workflow", tracker: bug, status: resolved, author: new_user8, assigned_to_id: new_user3.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue60 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Implement project ID validation", tracker: bug, status: in_progress, author: new_user8, assigned_to_id: new_user3.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue61 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Add project name validation", tracker: support, status: feedback, author: new_user9, assigned_to_id: new_user4.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue62 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Implement project name display", tracker: feature, status: in_progress, author: new_user9, assigned_to_id: new_user4.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue63 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Fix project name encoding", tracker: bug, status: resolved, author: new_user10, assigned_to_id: new_user5.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue64 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Optimize project search algorithm", tracker: bug, status: in_progress, author: new_user10, assigned_to_id: new_user5.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue65 = Issue.create!(project_id: project5.id, priority_id: priority2.id, subject: "Validate issue form security", tracker: bug, status: resolved, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue66 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Review authentication security", tracker: support, status: feedback, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue67 = Issue.create!(project_id: project5.id, priority_id: priority4.id, subject: "Implement project search analytics", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue68 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Create test cases for issue tracking", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user11.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue69 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Develop issue creation test suite", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user11.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue70 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "Analyze database schema for optimization", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user11.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue71 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Implement caching for API responses", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user11.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue72 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Design user-friendly error pages", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user11.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue73 = Issue.create!(project_id: project3.id, priority_id: priority2.id, subject: "Refactor authentication module", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user11.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue74 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Optimize image loading on the website", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user11.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue75 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "Develop a reporting dashboard", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user10.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue76 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Enhance security for file uploads", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue77 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Implement dark mode for the UI", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue78 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "Add multi-language support", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue79 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Integrate payment gateway", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue80 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Improve search functionality", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user12.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue81 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Create automated test cases", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user12.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue82 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Set up CI/CD pipeline", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user12.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue83 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Implement role-based access control", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user12.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue84 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Develop a mobile-friendly layout", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user12.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue85 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Add logging for API requests", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user12.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue86 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Optimize database queries", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user12.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue87 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Implement email notifications", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue88 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Enhance data export functionality", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue89 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Fix UI alignment issues", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue90 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Add support for file versioning", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user5.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue91 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Complete pending reports", tracker: bug, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today) 
      issue92 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Follow up on emails", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue93 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Schedule team meeting", tracker: support, status: feedback, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue94 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Review project updates", tracker: bug, status: in_progress, author: new_user2, assigned_to_id: new_user13.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue95 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Submit expense claims", tracker: bug, status: resolved, author: new_user3, assigned_to_id: new_user13.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue96 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Prepare presentation slides", tracker: bug, status: in_progress, author: new_user3, assigned_to_id: new_user13.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue97 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Call client for feedback", tracker: feature, status: in_progress, author: new_user4, assigned_to_id: new_user13.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue98 = Issue.create!(project_id: project2.id, priority_id: priority3.id, subject: "Organize workspace", tracker: support, status: feedback, author: new_user4, assigned_to_id: new_user13.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue99 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Update task tracker Security audit for login system", tracker: bug, status: in_progress, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue100 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Optimize project search performance", tracker: bug, status: resolved, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue101 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Implement user account verification", tracker: bug, status: resolved, author: new_user6, assigned_to_id: new_user1.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue102 = Issue.create!(project_id: project3.id, priority_id: priority2.id, subject: "Design responsive issue modal", tracker: bug, status: in_progress, author: new_user6, assigned_to_id: new_user1.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue103 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "Implement project search filters", tracker: support, status: feedback, author: new_user7, assigned_to_id: new_user2.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue104 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "Add project visibility controls", tracker: feature, status: in_progress, author: new_user7, assigned_to_id: new_user2.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue105 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Validate project assignment workflow", tracker: bug, status: resolved, author: new_user8, assigned_to_id: new_user3.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue106 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Implement project ID validation", tracker: bug, status: in_progress, author: new_user8, assigned_to_id: new_user3.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue107 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Add project name validation", tracker: support, status: feedback, author: new_user9, assigned_to_id: new_user4.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue108 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Implement project name display", tracker: feature, status: in_progress, author: new_user9, assigned_to_id: new_user4.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue109 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Fix project name encoding", tracker: bug, status: resolved, author: new_user10, assigned_to_id: new_user5.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue110 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Optimize project search algorithm", tracker: bug, status: in_progress, author: new_user10, assigned_to_id: new_user5.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue111 = Issue.create!(project_id: project5.id, priority_id: priority2.id, subject: "Validate issue form security", tracker: bug, status: resolved, author: admin_user, assigned_to_id: admin_user.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue112 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Review authentication security", tracker: support, status: feedback, author: admin_user, assigned_to_id: new_user14.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)
      issue113 = Issue.create!(project_id: project5.id, priority_id: priority4.id, subject: "Implement project search analytics", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: new_user14.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue114 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Create test cases for issue tracking", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user14.id, start_date: Date.today + 90, due_date: Date.today + 90, created_on: Date.today, updated_on: Date.today)

      issue115 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Optimize database queries for reports", tracker: support, status: new, author: admin_user, assigned_to_id: new_user5.id, start_date: Date.today - 90, due_date: Date.today - 90, created_on: Date.today, updated_on: Date.today)
      issue116 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Implement caching for search results", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue117 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "Enhance UI for task management", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user7.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue118 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Add multi-language support to forms", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue119 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Fix alignment issues in dashboard", tracker: support, status: new, author: admin_user, assigned_to_id: new_user8.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue120 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Develop API for user authentication", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue121 = Issue.create!(project_id: project7.id, priority_id: priority4.id, subject: "Integrate payment gateway for subscriptions", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user6.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue122 = Issue.create!(project_id: project8.id, priority_id: priority2.id, subject: "Optimize image loading for gallery", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user9.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue123 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Implement role-based access control", tracker: support, status: new, author: admin_user, assigned_to_id: new_user10.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue124 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Add logging for API requests", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue125 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Enhance security for file uploads", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue126 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Create automated test cases for issues", tracker: support, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue127 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Refactor authentication module", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue128 = Issue.create!(project_id: project6.id, priority_id: priority4.id, subject: "Design user-friendly error pages", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user5.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue129 = Issue.create!(project_id: project7.id, priority_id: priority1.id, subject: "Analyze database schema for optimization", tracker: support, status: new, author: admin_user, assigned_to_id: new_user6.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue130 = Issue.create!(project_id: project8.id, priority_id: priority2.id, subject: "Set up CI/CD pipeline for deployment", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user7.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue131 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Implement dark mode for the UI", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user8.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue132 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Improve search functionality", tracker: support, status: new, author: admin_user, assigned_to_id: new_user9.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue133 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Add support for file versioning", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user10.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))
      issue134 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Develop a reporting dashboard", tracker: bug, status: new, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.parse('2025-07-23'), due_date: Date.parse('2025-07-23'), created_on: Date.parse('2025-06-15'), updated_on: Date.parse('2025-04-24'))
      issue135 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Integrate analytics for project tracking", tracker: support, status: new, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.parse('2025-01-24'), due_date: Date.parse('2025-01-24'), created_on: Date.parse('2025-06-14'), updated_on: Date.parse('2025-04-24'))

      issue136 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Refactor user authentication module", tracker: bug, status: in_progress, author: new_user1, assigned_to_id: new_user10.id, start_date: Date.today - 85, due_date: Date.today - 80, created_on: Date.today, updated_on: Date.today)
      issue137 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Implement password strength meter", tracker: feature, status: feedback, author: new_user1, assigned_to_id: new_user9.id, start_date: Date.today - 75, due_date: Date.today - 70, created_on: Date.today, updated_on: Date.today)
      issue138 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Fix session timeout issue", tracker: bug, status: resolved, author: new_user2, assigned_to_id: new_user8.id, start_date: Date.today - 65, due_date: Date.today - 60, created_on: Date.today, updated_on: Date.today)
      issue139 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Add multi-factor authentication", tracker: feature, status: new, author: new_user2, assigned_to_id: new_user7.id, start_date: Date.today - 55, due_date: Date.today - 50, created_on: Date.today, updated_on: Date.today)
      issue140 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Optimize database queries for reports", tracker: bug, status: in_progress, author: new_user3, assigned_to_id: new_user6.id, start_date: Date.today - 45, due_date: Date.today - 40, created_on: Date.today, updated_on: Date.today)
      
      issue141 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Redesign dashboard layout", tracker: feature, status: feedback, author: new_user3, assigned_to_id: new_user5.id, start_date: Date.today - 35, due_date: Date.today - 30, created_on: Date.today, updated_on: Date.today)
      issue142 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Fix chart rendering issues", tracker: bug, status: resolved, author: new_user4, assigned_to_id: new_user4.id, start_date: Date.today - 25, due_date: Date.today - 20, created_on: Date.today, updated_on: Date.today)
      issue143 = Issue.create!(project_id: project2.id, priority_id: priority3.id, subject: "Implement export to PDF functionality", tracker: feature, status: new, author: new_user4, assigned_to_id: new_user3.id, start_date: Date.today - 15, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue144 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Add custom report templates", tracker: feature, status: in_progress, author: new_user5, assigned_to_id: new_user2.id, start_date: Date.today - 5, due_date: Date.today + 5, created_on: Date.today, updated_on: Date.today)
      issue145 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Fix timezone handling in reports", tracker: bug, status: feedback, author: new_user5, assigned_to_id: new_user1.id, start_date: Date.today + 5, due_date: Date.today + 10, created_on: Date.today, updated_on: Date.today)
      
      issue146 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Implement API rate limiting", tracker: feature, status: resolved, author: new_user6, assigned_to_id: new_user14.id, start_date: Date.today + 15, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue147 = Issue.create!(project_id: project3.id, priority_id: priority2.id, subject: "Fix CORS configuration issues", tracker: bug, status: in_progress, author: new_user6, assigned_to_id: admin_user.id, start_date: Date.today + 25, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue148 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "Add API documentation", tracker: support, status: new, author: new_user7, assigned_to_id: new_user10.id, start_date: Date.today + 35, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      issue149 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "Implement API versioning", tracker: feature, status: feedback, author: new_user7, assigned_to_id: new_user9.id, start_date: Date.today + 45, due_date: Date.today + 50, created_on: Date.today, updated_on: Date.today)
      issue150 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Fix JSON parsing errors", tracker: bug, status: resolved, author: new_user8, assigned_to_id: new_user8.id, start_date: Date.today + 55, due_date: Date.today + 60, created_on: Date.today, updated_on: Date.today)
      
      issue151 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Optimize image upload processing", tracker: bug, status: in_progress, author: new_user8, assigned_to_id: new_user15.id, start_date: Date.today + 10, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue152 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Implement file type validation", tracker: feature, status: feedback, author: new_user9, assigned_to_id: new_user15.id, start_date: Date.today + 15, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue153 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Add drag and drop file upload", tracker: feature, status: new, author: new_user9, assigned_to_id: new_user15.id, start_date: Date.today + 20, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue154 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Fix file storage cleanup", tracker: bug, status: resolved, author: new_user10, assigned_to_id: new_user15.id, start_date: Date.today + 25, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue155 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Implement cloud storage integration", tracker: feature, status: in_progress, author: new_user10, assigned_to_id: new_user15.id, start_date: Date.today + 30, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      
      issue156 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Redesign notification system", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user16.id, start_date: Date.today + 5, due_date: Date.today + 15, created_on: Date.today, updated_on: Date.today)
      issue157 = Issue.create!(project_id: project5.id, priority_id: priority2.id, subject: "Fix email delivery issues", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user16.id, start_date: Date.today + 10, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue158 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Add push notification support", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user16.id, start_date: Date.today + 15, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue159 = Issue.create!(project_id: project5.id, priority_id: priority4.id, subject: "Implement notification preferences", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: new_user16.id, start_date: Date.today + 20, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue160 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Fix mobile notification display", tracker: bug, status: feedback, author: admin_user, assigned_to_id: new_user16.id, start_date: Date.today + 25, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      
      issue161 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Implement dark mode UI", tracker: feature, status: resolved, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.today + 10, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue162 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Fix contrast ratio issues", tracker: bug, status: in_progress, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.today + 15, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue163 = Issue.create!(project_id: project6.id, priority_id: priority3.id, subject: "Add theme customization options", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.today + 20, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue164 = Issue.create!(project_id: project6.id, priority_id: priority4.id, subject: "Implement UI color palette system", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.today + 25, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue165 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Fix font loading performance", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user5.id, start_date: Date.today + 30, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      
      issue166 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement audit logging system", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: new_user6.id, start_date: Date.today + 5, due_date: Date.today + 15, created_on: Date.today, updated_on: Date.today)
      issue167 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Fix data export performance", tracker: bug, status: feedback, author: new_user1, assigned_to_id: new_user7.id, start_date: Date.today + 10, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue168 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Add CSV export options", tracker: feature, status: new, author: new_user2, assigned_to_id: new_user8.id, start_date: Date.today + 15, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue169 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Implement data retention policy", tracker: feature, status: in_progress, author: new_user2, assigned_to_id: new_user9.id, start_date: Date.today + 20, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue170 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Fix data backup scheduling", tracker: bug, status: resolved, author: new_user3, assigned_to_id: new_user10.id, start_date: Date.today + 25, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue171 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Implement role-based permissions", tracker: feature, status: feedback, author: new_user3, assigned_to_id: new_user16.id, start_date: Date.today + 30, due_date: Date.today + 60, created_on: Date.today, updated_on: Date.today)
      issue172 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Fix permission inheritance", tracker: bug, status: in_progress, author: new_user4, assigned_to_id: admin_user.id, start_date: Date.today + 15, due_date: Date.today + 45, created_on: Date.today, updated_on: Date.today)
      issue173 = Issue.create!(project_id: project2.id, priority_id: priority3.id, subject: "Add custom role creation", tracker: feature, status: new, author: new_user4, assigned_to_id: admin_user.id, start_date: Date.today + 10, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      issue174 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Implement permission templates", tracker: feature, status: feedback, author: new_user5, assigned_to_id: admin_user.id, start_date: Date.today + 20, due_date: Date.today + 50, created_on: Date.today, updated_on: Date.today)
      issue175 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Fix admin console access", tracker: bug, status: resolved, author: new_user5, assigned_to_id: admin_user.id, start_date: Date.today + 25, due_date: Date.today + 55, created_on: Date.today, updated_on: Date.today)
      
      issue176 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Implement task dependency system", tracker: feature, status: in_progress, author: new_user6, assigned_to_id: new_user1.id, start_date: Date.today + 5, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue177 = Issue.create!(project_id: project3.id, priority_id: priority2.id, subject: "Fix Gantt chart rendering", tracker: bug, status: feedback, author: new_user6, assigned_to_id: new_user2.id, start_date: Date.today + 10, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      issue178 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "Add milestone tracking", tracker: feature, status: new, author: new_user7, assigned_to_id: new_user3.id, start_date: Date.today + 15, due_date: Date.today + 45, created_on: Date.today, updated_on: Date.today)
      issue179 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "Implement critical path analysis", tracker: feature, status: in_progress, author: new_user7, assigned_to_id: new_user4.id, start_date: Date.today + 20, due_date: Date.today + 50, created_on: Date.today, updated_on: Date.today)
      issue180 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Fix task completion calculation", tracker: bug, status: resolved, author: new_user8, assigned_to_id: new_user5.id, start_date: Date.today + 25, due_date: Date.today + 55, created_on: Date.today, updated_on: Date.today)
      
      issue181 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Implement time tracking integration", tracker: feature, status: feedback, author: new_user8, assigned_to_id: new_user6.id, start_date: Date.today - 30, due_date: Date.today - 25, created_on: Date.today, updated_on: Date.today)
      issue182 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Fix timesheet approval workflow", tracker: bug, status: in_progress, author: new_user9, assigned_to_id: new_user7.id, start_date: Date.today - 35, due_date: Date.today - 20, created_on: Date.today, updated_on: Date.today)
      issue183 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Add overtime calculation", tracker: feature, status: new, author: new_user9, assigned_to_id: new_user8.id, start_date: Date.today - 40, due_date: Date.today - 35, created_on: Date.today, updated_on: Date.today)
      issue184 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Implement billing report generation", tracker: feature, status: feedback, author: new_user10, assigned_to_id: new_user9.id, start_date: Date.today - 45, due_date: Date.today - 30, created_on: Date.today, updated_on: Date.today)
      issue185 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Fix time entry rounding", tracker: bug, status: resolved, author: new_user10, assigned_to_id: new_user10.id, start_date: Date.today - 50, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      
      issue186 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Implement keyboard shortcuts", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: new_user17.id, start_date: Date.today - 55, due_date: Date.today - 25, created_on: Date.today, updated_on: Date.today)
      issue187 = Issue.create!(project_id: project5.id, priority_id: priority2.id, subject: "Fix accessibility in modals", tracker: bug, status: feedback, author: admin_user, assigned_to_id: new_user17.id, start_date: Date.today - 60, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue188 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Add screen reader support", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user17.id, start_date: Date.today - 15, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue189 = Issue.create!(project_id: project5.id, priority_id: priority4.id, subject: "Implement focus management", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: new_user17.id, start_date: Date.today - 10, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue190 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Fix tab navigation issues", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user17.id, start_date: Date.today - 15, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      
      issue191 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Redesign search interface", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user17.id, start_date: Date.today - 20, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue192 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Fix search result ranking", tracker: bug, status: in_progress, author: admin_user, assigned_to_id: new_user7.id, start_date: Date.today - 25, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue193 = Issue.create!(project_id: project6.id, priority_id: priority3.id, subject: "Add advanced search filters", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user8.id, start_date: Date.today - 30, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue194 = Issue.create!(project_id: project6.id, priority_id: priority4.id, subject: "Implement search history", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user9.id, start_date: Date.today - 35, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue195 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Fix search indexing performance", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user10.id, start_date: Date.today - 40, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      
      issue196 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement data validation rules", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today - 15, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue197 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Fix form submission errors", tracker: bug, status: feedback, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today - 25, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue198 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Add input masking", tracker: feature, status: new, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today - 35, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue199 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Implement conditional fields", tracker: feature, status: in_progress, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today - 45, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue200 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Fix date picker localization", tracker: bug, status: resolved, author: new_user3, assigned_to_id: admin_user.id, start_date: Date.today - 55, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      
      issue201 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Implement bulk actions", tracker: feature, status: feedback, author: new_user3, assigned_to_id: new_user18.id, start_date: Date.today - 5, due_date: Date.today + 10, created_on: Date.today, updated_on: Date.today)
      issue202 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Fix selection persistence", tracker: bug, status: in_progress, author: new_user4, assigned_to_id: new_user18.id, start_date: Date.today + 20, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue203 = Issue.create!(project_id: project2.id, priority_id: priority3.id, subject: "Add undo functionality", tracker: feature, status: new, author: new_user4, assigned_to_id: new_user18.id, start_date: Date.today + 30, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue204 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Implement action confirmation", tracker: feature, status: feedback, author: new_user5, assigned_to_id: new_user18.id, start_date: Date.today + 40, due_date: Date.today + 45, created_on: Date.today, updated_on: Date.today)
      issue205 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Fix bulk export formatting", tracker: bug, status: resolved, author: new_user5, assigned_to_id: new_user18.id, start_date: Date.today + 50, due_date: Date.today + 55, created_on: Date.today, updated_on: Date.today)
      
      issue206 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Implement comment threading", tracker: feature, status: in_progress, author: new_user6, assigned_to_id: new_user18.id, start_date: Date.today + 10, due_date: Date.today + 15, created_on: Date.today, updated_on: Date.today)
      issue207 = Issue.create!(project_id: project3.id, priority_id: priority2.id, subject: "Fix mention notifications", tracker: bug, status: feedback, author: new_user6, assigned_to_id: new_user4.id, start_date: Date.today + 20, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue208 = Issue.create!(project_id: project3.id, priority_id: priority3.id, subject: "Add comment reactions", tracker: feature, status: new, author: new_user7, assigned_to_id: new_user3.id, start_date: Date.today + 30, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue209 = Issue.create!(project_id: project3.id, priority_id: priority4.id, subject: "Implement comment editing", tracker: feature, status: in_progress, author: new_user7, assigned_to_id: new_user2.id, start_date: Date.today + 40, due_date: Date.today + 45, created_on: Date.today, updated_on: Date.today)
      issue210 = Issue.create!(project_id: project3.id, priority_id: priority1.id, subject: "Fix comment sorting", tracker: bug, status: resolved, author: new_user8, assigned_to_id: new_user1.id, start_date: Date.today + 50, due_date: Date.today + 55, created_on: Date.today, updated_on: Date.today)
      
      issue211 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Implement file previews", tracker: feature, status: feedback, author: new_user8, assigned_to_id: admin_user.id, start_date: Date.today + 15, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue212 = Issue.create!(project_id: project4.id, priority_id: priority2.id, subject: "Fix PDF rendering issues", tracker: bug, status: in_progress, author: new_user9, assigned_to_id: admin_user.id, start_date: Date.today + 25, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue213 = Issue.create!(project_id: project4.id, priority_id: priority3.id, subject: "Add video thumbnails", tracker: feature, status: new, author: new_user9, assigned_to_id: admin_user.id, start_date: Date.today + 35, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      issue214 = Issue.create!(project_id: project4.id, priority_id: priority4.id, subject: "Implement document annotation", tracker: feature, status: feedback, author: new_user10, assigned_to_id: admin_user.id, start_date: Date.today + 45, due_date: Date.today + 50, created_on: Date.today, updated_on: Date.today)
      issue215 = Issue.create!(project_id: project4.id, priority_id: priority1.id, subject: "Fix image compression", tracker: bug, status: resolved, author: new_user10, assigned_to_id: admin_user.id, start_date: Date.today + 55, due_date: Date.today + 60, created_on: Date.today, updated_on: Date.today)
      
      issue216 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Implement version control integration", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: new_user10.id, start_date: Date.today + 15, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue217 = Issue.create!(project_id: project5.id, priority_id: priority2.id, subject: "Fix commit reference parsing", tracker: bug, status: feedback, author: admin_user, assigned_to_id: new_user20.id, start_date: Date.today + 25, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue218 = Issue.create!(project_id: project5.id, priority_id: priority3.id, subject: "Add branch comparison", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user20.id, start_date: Date.today + 35, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      issue219 = Issue.create!(project_id: project5.id, priority_id: priority4.id, subject: "Implement code review workflow", tracker: feature, status: in_progress, author: admin_user, assigned_to_id: new_user20.id, start_date: Date.today + 45, due_date: Date.today + 50, created_on: Date.today, updated_on: Date.today)
      issue220 = Issue.create!(project_id: project5.id, priority_id: priority1.id, subject: "Fix diff display issues", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user20.id, start_date: Date.today + 55, due_date: Date.today + 60, created_on: Date.today, updated_on: Date.today)
      
      issue221 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Implement real-time updates", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user20.id, start_date: Date.today + 5, due_date: Date.today + 10, created_on: Date.today, updated_on: Date.today)
      issue222 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Fix websocket connection drops", tracker: bug, status: in_progress, author: admin_user, assigned_to_id: new_user20.id, start_date: Date.today + 20, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue223 = Issue.create!(project_id: project6.id, priority_id: priority3.id, subject: "Add presence indicators", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.today + 30, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue224 = Issue.create!(project_id: project6.id, priority_id: priority4.id, subject: "Implement typing notifications", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.today + 40, due_date: Date.today + 45, created_on: Date.today, updated_on: Date.today)
      issue225 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Fix message synchronization", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.today + 50, due_date: Date.today + 55, created_on: Date.today, updated_on: Date.today)
      
      issue226 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Implement data export templates", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today + 10, due_date: Date.today + 15, created_on: Date.today, updated_on: Date.today)
      issue227 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Fix CSV encoding issues", tracker: bug, status: feedback, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today + 20, due_date: Date.today + 25, created_on: Date.today, updated_on: Date.today)
      issue228 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Add Excel export formatting", tracker: feature, status: new, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today + 30, due_date: Date.today + 35, created_on: Date.today, updated_on: Date.today)
      issue229 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Implement scheduled exports", tracker: feature, status: in_progress, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today + 40, due_date: Date.today + 45, created_on: Date.today, updated_on: Date.today)
      issue230 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Fix export performance", tracker: bug, status: resolved, author: new_user3, assigned_to_id: admin_user.id, start_date: Date.today + 50, due_date: Date.today + 55, created_on: Date.today, updated_on: Date.today)
      
      issue231 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Implement audit trail", tracker: feature, status: feedback, author: new_user3, assigned_to_id: new_user10.id, start_date: Date.today + 5, due_date: Date.today + 10, created_on: Date.today, updated_on: Date.today)
      issue232 = Issue.create!(project_id: project2.id, priority_id: priority2.id, subject: "Fix change detection", tracker: bug, status: in_progress, author: new_user4, assigned_to_id: new_user9.id, start_date: Date.today + 15, due_date: Date.today + 20, created_on: Date.today, updated_on: Date.today)
      issue233 = Issue.create!(project_id: project2.id, priority_id: priority3.id, subject: "Add change comments", tracker: feature, status: new, author: new_user4, assigned_to_id: new_user8.id, start_date: Date.today + 25, due_date: Date.today + 30, created_on: Date.today, updated_on: Date.today)
      issue234 = Issue.create!(project_id: project2.id, priority_id: priority4.id, subject: "Implement rollback functionality", tracker: feature, status: feedback, author: new_user5, assigned_to_id: new_user7.id, start_date: Date.today + 35, due_date: Date.today + 40, created_on: Date.today, updated_on: Date.today)
      issue235 = Issue.create!(project_id: project2.id, priority_id: priority1.id, subject: "Fix audit log performance", tracker: bug, status: resolved, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today + 45, due_date: Date.today + 50, created_on: Date.today, updated_on: Date.today)


      issue236 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Enable multi-project reporting", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user19.id, start_date: Date.today - 20, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)
      issue237 = Issue.create!(project_id: project6.id, priority_id: priority3.id, subject: "Fix notification email duplicates", tracker: bug, status: in_progress, author: admin_user, assigned_to_id: new_user19.id, start_date: Date.today - 15, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)
      issue238 = Issue.create!(project_id: project6.id, priority_id: priority4.id, subject: "Add weekly summary reports", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user19.id, start_date: Date.today - 30, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)
      issue239 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Fix user avatar loading", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user19.id, start_date: Date.today - 25, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)
      issue240 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Implement real-time collaboration", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user19.id, start_date: Date.today - 20, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)

      issue241 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Fix auto-save bug in editor", tracker: bug, status: in_progress, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today - 25, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)
      issue242 = Issue.create!(project_id: project1.id, priority_id: priority4.id, subject: "Add export options for charts", tracker: feature, status: feedback, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today - 40, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)
      issue243 = Issue.create!(project_id: project1.id, priority_id: priority1.id, subject: "Fix export template alignment", tracker: bug, status: resolved, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today - 35, due_date: Date.today - 15, created_on: Date.today, updated_on: Date.today)
      issue244 = Issue.create!(project_id: project1.id, priority_id: priority2.id, subject: "Add scheduled data backups", tracker: feature, status: new, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today - 15, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue245 = Issue.create!(project_id: project1.id, priority_id: priority3.id, subject: "Fix slow report generation", tracker: bug, status: in_progress, author: new_user3, assigned_to_id: admin_user.id, start_date: Date.today - 30, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)

      issue246 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Add audit log filtering", tracker: support, status: new, author: new_user3, assigned_to_id: new_user19.id, start_date: Date.today - 35, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue247 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Fix rollback data corruption", tracker: support, status: new, author: new_user4, assigned_to_id: new_user9.id, start_date: Date.today - 50, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue248 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Add multi-user change tracking", tracker: support, status: new, author: new_user4, assigned_to_id: new_user8.id, start_date: Date.today - 35, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue249 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Fix stale session logouts", tracker: support, status: new, author: new_user5, assigned_to_id: new_user7.id, start_date: Date.today - 20, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue250 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Implement access control matrix", tracker: support, status: new, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today - 25, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)

      issue251 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Fix API rate limit enforcement", tracker: support, status: new, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.today - 10, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue252 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Add API key management UI", tracker: support, status: new, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.today - 15, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue253 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Fix dashboard chart flickering", tracker: support, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.today - 30, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue254 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Add role-based permissions editor", tracker: support, status: new, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.today - 15, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)
      issue255 = Issue.create!(project_id: project9.id, priority_id: priority2.id, subject: "Fix missing breadcrumb navigation", tracker: support, status: new, author: admin_user, assigned_to_id: new_user5.id, start_date: Date.today - 20, due_date: Date.today - 10, created_on: Date.today, updated_on: Date.today)



    if Redmine::Plugin.installed?(:agile_board)
  
  
    issue33=Issue.create!(project_id: project8.id,priority_id: priority1.id,subject: "create a agile issue status column setting",tracker: feature,status: new,assigned_to_id: new_user6.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue34=Issue.create!(project_id: project8.id,priority_id: priority2.id,subject: "create a agile card field column setting",tracker: feature,status: new,assigned_to_id: new_user6.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue37=Issue.create!(project_id: project8.id,priority_id: priority1.id,subject: "create a demo server for agile",tracker: feature,status: new,assigned_to_id: new_user7.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue38=Issue.create!(project_id: project8.id,priority_id: priority2.id,subject: "implement wip functionality",tracker: feature,status: new,assigned_to_id: new_user7.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue39=Issue.create!(project_id: project8.id,priority_id: priority3.id,subject: "update agile setting ",tracker: feature,status: new,assigned_to_id: new_user8.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue40=Issue.create!(project_id: project8.id,priority_id: priority4.id,subject: "added a agile config form",tracker: feature,status: new,assigned_to_id: new_user8.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue41=Issue.create!(project_id: project8.id,priority_id: priority1.id,subject: "Agile board card create",tracker: feature,status: new,assigned_to_id: new_user9.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date5, due_date: end_date5,fixed_version_id: version2.id)
    issue42=Issue.create!(project_id: project8.id,priority_id: priority2.id,subject: "Total time update on scroll",tracker: feature,status: new,assigned_to_id: new_user9.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue43=Issue.create!(project_id: project8.id,priority_id: priority3.id,subject: "card fiels are show according to project",tracker: feature,status: new,assigned_to_id: new_user10.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
    issue44=Issue.create!(project_id: project8.id,priority_id: priority4.id,subject: "Issue status are show according to project",tracker: feature,status: new,assigned_to_id: new_user10.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)

    issue221 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Implement real-time updates", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user5.id, start_date: Date.today + 765, due_date: Date.today + 770, created_on: Date.today + 765, updated_on: Date.today)
    issue222 = Issue.create!(project_id: project6.id, priority_id: priority2.id, subject: "Fix websocket connection drops", tracker: bug, status: in_progress, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.today + 775, due_date: Date.today + 780, created_on: Date.today + 775, updated_on: Date.today)
    issue223 = Issue.create!(project_id: project6.id, priority_id: priority3.id, subject: "Add presence indicators", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.today + 785, due_date: Date.today + 790, created_on: Date.today + 785, updated_on: Date.today)
    issue224 = Issue.create!(project_id: project6.id, priority_id: priority4.id, subject: "Implement typing notifications", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.today + 795, due_date: Date.today + 800, created_on: Date.today + 795, updated_on: Date.today)
    issue225 = Issue.create!(project_id: project6.id, priority_id: priority1.id, subject: "Fix message synchronization", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.today + 805, due_date: Date.today + 810, created_on: Date.today + 805, updated_on: Date.today)
    
    issue226 = Issue.create!(project_id: project7.id, priority_id: priority1.id, subject: "Implement data export templates", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today + 815, due_date: Date.today + 820, created_on: Date.today + 815, updated_on: Date.today)
    issue227 = Issue.create!(project_id: project7.id, priority_id: priority2.id, subject: "Fix CSV encoding issues", tracker: bug, status: feedback, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today + 825, due_date: Date.today + 830, created_on: Date.today + 825, updated_on: Date.today)
    issue228 = Issue.create!(project_id: project7.id, priority_id: priority3.id, subject: "Add Excel export formatting", tracker: feature, status: new, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today + 835, due_date: Date.today + 840, created_on: Date.today + 835, updated_on: Date.today)
    issue229 = Issue.create!(project_id: project7.id, priority_id: priority4.id, subject: "Implement scheduled exports", tracker: feature, status: in_progress, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today + 845, due_date: Date.today + 850, created_on: Date.today + 845, updated_on: Date.today)
    issue230 = Issue.create!(project_id: project7.id, priority_id: priority1.id, subject: "Fix export performance", tracker: bug, status: resolved, author: new_user3, assigned_to_id: admin_user.id, start_date: Date.today + 855, due_date: Date.today + 860, created_on: Date.today + 855, updated_on: Date.today)
    
    issue231 = Issue.create!(project_id: project8.id, priority_id: priority1.id, subject: "Implement audit trail", tracker: feature, status: feedback, author: new_user3, assigned_to_id: new_user10.id, start_date: Date.today + 865, due_date: Date.today + 870, created_on: Date.today + 865, updated_on: Date.today)
    issue232 = Issue.create!(project_id: project8.id, priority_id: priority2.id, subject: "Fix change detection", tracker: bug, status: in_progress, author: new_user4, assigned_to_id: new_user9.id, start_date: Date.today + 875, due_date: Date.today + 880, created_on: Date.today + 875, updated_on: Date.today)
    issue233 = Issue.create!(project_id: project8.id, priority_id: priority3.id, subject: "Add change comments", tracker: feature, status: new, author: new_user4, assigned_to_id: new_user8.id, start_date: Date.today + 885, due_date: Date.today + 890, created_on: Date.today + 885, updated_on: Date.today)
    issue234 = Issue.create!(project_id: project8.id, priority_id: priority4.id, subject: "Implement rollback functionality", tracker: feature, status: feedback, author: new_user5, assigned_to_id: new_user7.id, start_date: Date.today + 895, due_date: Date.today + 900, created_on: Date.today + 895, updated_on: Date.today)
    issue235 = Issue.create!(project_id: project8.id, priority_id: priority1.id, subject: "Fix audit log performance", tracker: bug, status: resolved, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today + 905, due_date: Date.today + 910, created_on: Date.today + 905, updated_on: Date.today)
    else
      issue26=Issue.create!(project_id: project7.id,priority_id: priority3.id,subject: "Agile board added in my page",tracker: feature,status: new,assigned_to_id: new_user1.id,author:new_user6,created_on: Date.today,updated_on: Date.today,start_date: start_date5, due_date: end_date5,fixed_version_id: version6.id)
      issue27=Issue.create!(project_id: project7.id,priority_id: priority4.id,subject: "Timelog not appear",tracker: bug,status: new,assigned_to_id: new_user1.id,author:new_user6,created_on: Date.today,updated_on: Date.today,fixed_version_id: version6.id, start_date: start_date5, due_date: end_date5)
      issue28=Issue.create!(project_id: project7.id,priority_id: priority1.id,subject: "create custom agile board",tracker: feature,status: new,assigned_to_id: new_user2.id,author:new_user7,created_on: Date.today,updated_on: Date.today,start_date: start_date5, due_date: end_date5,fixed_version_id: version6.id)
      issue29=Issue.create!(project_id: project7.id,priority_id: priority2.id,subject: "create a backlog page",tracker: feature,status: new,assigned_to_id: new_user2.id,author:new_user7,created_on: Date.today,updated_on: Date.today,fixed_version_id: version5.id, start_date: start_date2, due_date: end_date2)
      issue30=Issue.create!(project_id: project7.id,priority_id: priority3.id,subject: "relation issue functionality in agile",tracker: feature,status: new,assigned_to_id: new_user3.id,author:new_user7,created_on: Date.today,updated_on: Date.today,fixed_version_id: version5.id, start_date: start_date2, due_date: end_date2)
      issue31=Issue.create!(project_id: project7.id,priority_id: priority4.id,subject: "implement fetch issue api",tracker: feature,status: new,assigned_to_id: new_user3.id,author:new_user7,created_on: Date.today,updated_on: Date.today,fixed_version_id: version5.id, start_date: start_date2, due_date: end_date2)
      issue32=Issue.create!(project_id: project7.id,priority_id: priority4.id,subject: "implement get and post api for agile",tracker: feature,status: new,assigned_to_id: new_user4.id,author:new_user7,created_on: Date.today,updated_on: Date.today,fixed_version_id: version6.id, start_date: start_date2, due_date: end_date2)
      issue35=Issue.create!(project_id: project7.id,priority_id: priority3.id,subject: "create a agile time field column setting",tracker: feature,status: new,assigned_to_id: new_user4.id,author:new_user7,created_on: Date.today,updated_on: Date.today, start_date: start_date1, due_date: end_date1,fixed_version_id: version6.id)
      issue36=Issue.create!(project_id: project7.id,priority_id: priority4.id,subject: "Delete api for custom agile",tracker: feature,status: new,assigned_to_id: new_user5.id,author:new_user7,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version6.id)

      issue33=Issue.create!(project_id: project8.id,priority_id: priority1.id,subject: "create a agile issue status column setting",tracker: feature,status: new,assigned_to_id: new_user5.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue34=Issue.create!(project_id: project8.id,priority_id: priority2.id,subject: "create a agile card field column setting",tracker: feature,status: new,assigned_to_id: new_user6.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue37=Issue.create!(project_id: project8.id,priority_id: priority1.id,subject: "create a demo server for agile",tracker: feature,status: new,assigned_to_id: new_user6.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue38=Issue.create!(project_id: project8.id,priority_id: priority2.id,subject: "implement wip functionality",tracker: feature,status: new,assigned_to_id: new_user7.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue39=Issue.create!(project_id: project8.id,priority_id: priority3.id,subject: "update agile setting ",tracker: feature,status: new,assigned_to_id: new_user8.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue40=Issue.create!(project_id: project8.id,priority_id: priority4.id,subject: "added a agile config form",tracker: feature,status: new,assigned_to_id: new_user9.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue41=Issue.create!(project_id: project8.id,priority_id: priority1.id,subject: "Agile board card create",tracker: feature,status: new,assigned_to_id: new_user10.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date5, due_date: end_date5,fixed_version_id: version2.id)
      issue42=Issue.create!(project_id: project8.id,priority_id: priority2.id,subject: "Total time update on scroll",tracker: feature,status: new,assigned_to_id: admin_user.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue43=Issue.create!(project_id: project8.id,priority_id: priority3.id,subject: "card fiels are show according to project",tracker: feature,status: new,assigned_to_id: admin_user.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)
      issue44=Issue.create!(project_id: project8.id,priority_id: priority4.id,subject: "Issue status are show according to project",tracker: feature,status: new,assigned_to_id: admin_user.id,author:new_user8,created_on: Date.today,updated_on: Date.today,start_date: start_date1, due_date: end_date1,fixed_version_id: version2.id)

      issue221 = Issue.create!(project_id: project7.id, priority_id: priority1.id, subject: "Implement real-time updates", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user5.id, start_date: Date.today + 765, due_date: Date.today + 770, created_on: Date.today + 765, updated_on: Date.today)
      issue222 = Issue.create!(project_id: project7.id, priority_id: priority2.id, subject: "Fix websocket connection drops", tracker: bug, status: in_progress, author: admin_user, assigned_to_id: new_user4.id, start_date: Date.today + 775, due_date: Date.today + 780, created_on: Date.today + 775, updated_on: Date.today)
      issue223 = Issue.create!(project_id: project7.id, priority_id: priority3.id, subject: "Add presence indicators", tracker: feature, status: new, author: admin_user, assigned_to_id: new_user3.id, start_date: Date.today + 785, due_date: Date.today + 790, created_on: Date.today + 785, updated_on: Date.today)
      issue224 = Issue.create!(project_id: project7.id, priority_id: priority4.id, subject: "Implement typing notifications", tracker: feature, status: feedback, author: admin_user, assigned_to_id: new_user2.id, start_date: Date.today + 795, due_date: Date.today + 800, created_on: Date.today + 795, updated_on: Date.today)
      issue225 = Issue.create!(project_id: project7.id, priority_id: priority1.id, subject: "Fix message synchronization", tracker: bug, status: resolved, author: admin_user, assigned_to_id: new_user1.id, start_date: Date.today + 805, due_date: Date.today + 810, created_on: Date.today + 805, updated_on: Date.today)
      
      issue226 = Issue.create!(project_id: project8.id, priority_id: priority1.id, subject: "Implement data export templates", tracker: feature, status: in_progress, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today + 815, due_date: Date.today + 820, created_on: Date.today + 815, updated_on: Date.today)
      issue227 = Issue.create!(project_id: project8.id, priority_id: priority2.id, subject: "Fix CSV encoding issues", tracker: bug, status: feedback, author: new_user1, assigned_to_id: admin_user.id, start_date: Date.today + 825, due_date: Date.today + 830, created_on: Date.today + 825, updated_on: Date.today)
      issue228 = Issue.create!(project_id: project8.id, priority_id: priority3.id, subject: "Add Excel export formatting", tracker: feature, status: new, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today + 835, due_date: Date.today + 840, created_on: Date.today + 835, updated_on: Date.today)
      issue229 = Issue.create!(project_id: project8.id, priority_id: priority4.id, subject: "Implement scheduled exports", tracker: feature, status: in_progress, author: new_user2, assigned_to_id: admin_user.id, start_date: Date.today + 845, due_date: Date.today + 850, created_on: Date.today + 845, updated_on: Date.today)
      issue230 = Issue.create!(project_id: project8.id, priority_id: priority1.id, subject: "Fix export performance", tracker: bug, status: resolved, author: new_user3, assigned_to_id: admin_user.id, start_date: Date.today + 855, due_date: Date.today + 860, created_on: Date.today + 855, updated_on: Date.today)
      
      issue231 = Issue.create!(project_id: project8.id, priority_id: priority1.id, subject: "Implement audit trail", tracker: feature, status: feedback, author: new_user3, assigned_to_id: new_user10.id, start_date: Date.today + 865, due_date: Date.today + 870, created_on: Date.today + 865, updated_on: Date.today)
      issue232 = Issue.create!(project_id: project8.id, priority_id: priority2.id, subject: "Fix change detection", tracker: bug, status: in_progress, author: new_user4, assigned_to_id: new_user9.id, start_date: Date.today + 875, due_date: Date.today + 880, created_on: Date.today + 875, updated_on: Date.today)
      issue233 = Issue.create!(project_id: project8.id, priority_id: priority3.id, subject: "Add change comments", tracker: feature, status: new, author: new_user4, assigned_to_id: new_user8.id, start_date: Date.today + 885, due_date: Date.today + 890, created_on: Date.today + 885, updated_on: Date.today)
      issue234 = Issue.create!(project_id: project8.id, priority_id: priority4.id, subject: "Implement rollback functionality", tracker: feature, status: feedback, author: new_user5, assigned_to_id: new_user7.id, start_date: Date.today + 895, due_date: Date.today + 900, created_on: Date.today + 895, updated_on: Date.today)
      issue235 = Issue.create!(project_id: project8.id, priority_id: priority1.id, subject: "Fix audit log performance", tracker: bug, status: resolved, author: new_user5, assigned_to_id: new_user6.id, start_date: Date.today + 905, due_date: Date.today + 910, created_on: Date.today + 905, updated_on: Date.today)
    end


    #Time Entries
    TimeEntry.create!(issue: issue4, project: project1, user: new_user1, hours: 7.5, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 2, comments: 'UI improvements')
    TimeEntry.create!(issue: issue3, project: project1, user: new_user2, hours: 3.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 3, comments: 'Bug fixing')
    TimeEntry.create!(issue: issue4, project: project1, user: new_user2, hours: 3.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 3, comments: 'error solved')
    TimeEntry.create!(issue: issue5, project: project1, user: new_user2, hours: 4.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 3, comments: 'Button not working solved')
    TimeEntry.create!(issue: issue6, project: project2, user: new_user6, hours: 4.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 3, comments: 'Remove extra code')
    TimeEntry.create!(issue: issue7, project: project2, user: new_user8, hours: 7.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 1, comments: 'Api created')
    TimeEntry.create!(issue: issue8, project: project2, user: new_user5, hours: 1.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 12, comments: 'Time log controller')
    TimeEntry.create!(issue: issue9, project: project2, user: new_user1, hours: 1.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 12, comments: 'Time log controller')
    TimeEntry.create!(issue: issue10, project: project2, user: new_user5, hours: 1.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 12, comments: 'Time log controller')
    TimeEntry.create!(issue: issue11, project: project3, user: new_user5, hours: 1.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 12, comments: 'Time log controller')
    TimeEntry.create!(issue: issue12, project: project3, user: new_user4, hours: 1.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 12, comments: 'Time log controller')
    TimeEntry.create!(issue: issue13, project: project3, user: new_user8, hours: 1.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 12, comments: 'Resolve bug of error not occur')
    TimeEntry.create!(issue: issue14, project: project3, user: new_user7, hours: 1.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 12, comments: 'The project should be visible in issues')
    TimeEntry.create!(issue: issue15, project: project4, user: new_user6, hours: 5.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 10, comments: 'The issue should be created with a project')
    TimeEntry.create!(issue: issue16, project: project4, user: new_user6, hours: 5.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 10, comments: '"Project id should appear in issues')
    TimeEntry.create!(issue: issue17, project: project4, user: new_user2, hours: 5.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 6, comments: 'Project name should be added with project id')
    TimeEntry.create!(issue: issue20, project: project5, user: new_user2, hours: 5.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: Date.today - 6, comments: 'Implement project search')
    TimeEntry.create!(issue: issue21, project: project5, user: new_user2, hours: 5.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 6, comments: 'Check new issues form')
    TimeEntry.create!(issue: issue22, project: project5, user: new_user2, hours: 5.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: Date.today - 6, comments: 'To check the login form')
    TimeEntry.create!(issue: issue45, project: project1, user: new_user3, hours: 6.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: issue45.start_date + 2, comments: 'OAuth login integration')
    TimeEntry.create!(issue: issue46, project: project1, user: new_user4, hours: 4.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: issue46.start_date + 3, comments: 'Elasticsearch integration')
    TimeEntry.create!(issue: issue47, project: project1, user: new_user9, hours: 5.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: issue47.start_date + 4, comments: 'User profile management')
    TimeEntry.create!(issue: issue48, project: project1, user: new_user9, hours: 3.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: issue48.start_date + 5, comments: 'Redesign issue workflow')
    TimeEntry.create!(issue: issue49, project: project1, user: new_user8, hours: 7.0, activity: TimeEntryActivity.find_by(name: 'Development'), spent_on: issue49.start_date + 6, comments: 'Time tracking reports')
    TimeEntry.create!(issue: issue50, project: project2, user: new_user8, hours: 2.0, activity: TimeEntryActivity.find_by(name: 'Design'), spent_on: issue50.start_date + 7, comments: 'Workload analytics')

    Setting.rest_api_enabled = true
    Setting.jsonp_enabled = true 
    Setting.rest_api_enabled = '1' 
    Setting.jsonp_enabled = '1' 


    if Redmine::Plugin.installed?(:agile_board)
    
      Setting.plugin_agile_board = {
      'activate_sprint_by_default' => { 'enabled' => '1' },
      'agile_card_creation' => { 'enabled' => '1' },
      'story_points' => {
      'enabled' => '1',
      'trackers_for_sp' => '', # Leave empty for "All trackers"
      'story_points_values' =>  '0, 1, 2, 3, 5, 8, 13, 21, 40, 100' # Default story point values
      }
     }
    
    end