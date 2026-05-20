require 'fileutils'
require 'set'
require 'time'

module RedminefluxGanttPlugin
  class QaSeedCriticalError < StandardError; end

  class QaSeedRunner
    SEED_MARKER = '[RF_QA_SEED]'.freeze
    ISSUE_TARGET_PER_PROJECT = 100

    REQUIRED_ACTIVITIES = [
      'Development',
      'Testing',
      'Bug Fixing',
      'UI Design',
      'Automation Testing',
      'Deployment'
    ].freeze

    REQUIRED_STATUSES = [
      { name: 'New', is_default: true, is_closed: false },
      { name: 'In Progress', is_default: false, is_closed: false },
      { name: 'QA', is_default: false, is_closed: false },
      { name: 'Resolved', is_default: false, is_closed: false },
      { name: 'Reopened', is_default: false, is_closed: false },
      { name: 'Closed', is_default: false, is_closed: true }
    ].freeze

    REQUIRED_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent', 'Immediate'].freeze
    REQUIRED_TRACKERS = ['Bug', 'Feature', 'Support', 'Test Case'].freeze
    REQUIRED_ROLES = ['QA Engineer', 'Developer', 'Manager', 'Client'].freeze

    REQUIRED_USERS = [
      { login: 'rahul.sharma', firstname: 'Rahul', lastname: 'Sharma', password: 'Rahul@123', role: 'Manager' },
      { login: 'priya.patel', firstname: 'Priya', lastname: 'Patel', password: 'Priya@123', role: 'QA Engineer' },
      { login: 'aman.verma', firstname: 'Aman', lastname: 'Verma', password: 'Aman@123', role: 'Developer' },
      { login: 'neha.joshi', firstname: 'Neha', lastname: 'Joshi', password: 'Neha@123', role: 'QA Engineer' },
      { login: 'rohit.mehta', firstname: 'Rohit', lastname: 'Mehta', password: 'Rohit@123', role: 'Developer' },
      { login: 'client.demo', firstname: 'Client', lastname: 'Demo', password: 'Client@123', role: 'Client' },
      { login: 'sneha.kapoor', firstname: 'Sneha', lastname: 'Kapoor', password: 'Sneha@123', role: 'Manager' }
    ].freeze

    REQUIRED_PROJECTS = [
      { name: 'Flux ERP System', identifier: 'flux-erp-system' },
      { name: 'Mobile Banking App', identifier: 'mobile-banking-app' },
      { name: 'E-Commerce Platform', identifier: 'ecommerce-platform' },
      { name: 'Healthcare Management System', identifier: 'healthcare-management-system' },
      { name: 'AI Automation Portal', identifier: 'ai-automation-portal' }
    ].freeze

    REQUIRED_VERSIONS = [
      { name: 'v1.0.0', description: 'Initial stable release' },
      { name: 'v1.1.0', description: 'Minor enhancements and bug fixes' },
      { name: 'v2.0.0', description: 'Major feature release' },
      { name: 'Hotfix Release', description: 'Production hotfix release' }
    ].freeze

    REQUIRED_CATEGORIES = [
      { name: 'Backend', assignee_login: 'aman.verma' },
      { name: 'Frontend', assignee_login: 'rohit.mehta' },
      { name: 'QA Testing', assignee_login: 'priya.patel' },
      { name: 'Automation', assignee_login: 'neha.joshi' },
      { name: 'DevOps', assignee_login: 'rahul.sharma' },
      { name: 'Client Review', assignee_login: 'client.demo' }
    ].freeze

    MEMBER_ASSIGNMENTS = {
      'rahul.sharma' => 'Manager',
      'sneha.kapoor' => 'Manager',
      'priya.patel' => 'QA Engineer',
      'neha.joshi' => 'QA Engineer',
      'aman.verma' => 'Developer',
      'rohit.mehta' => 'Developer',
      'client.demo' => 'Client'
    }.freeze

    TRACKER_CATEGORY_RULES = {
      'Bug' => ['Backend', 'Frontend', 'QA Testing'],
      'Feature' => ['Backend', 'Frontend', 'Automation'],
      'Support' => ['DevOps', 'Client Review'],
      'Test Case' => ['QA Testing', 'Automation']
    }.freeze

    MODULE_CANDIDATES = {
      'Issue Tracking' => ['issue_tracking'],
      'Time Tracking' => ['time_tracking'],
      'Gantt' => ['gantt', 'redmineflux_gantt_chart'],
      'Calendar' => ['calendar'],
      'Files' => ['files'],
      'Wiki' => ['wiki'],
      'Repository' => ['repository'],
      'Workload' => ['workload', 'redmineflux_workload']
    }.freeze

    WORKFLOW_RULES = {
      'QA Engineer' => [
        ['New', 'In Progress'],
        ['In Progress', 'QA'],
        ['QA', 'Resolved'],
        ['QA', 'Reopened'],
        ['Reopened', 'In Progress'],
        ['Resolved', 'Closed']
      ],
      'Developer' => [
        ['New', 'In Progress'],
        ['In Progress', 'Resolved'],
        ['Resolved', 'Reopened'],
        ['Reopened', 'In Progress']
      ],
      'Manager' => [
        ['New', 'Closed'],
        ['In Progress', 'Closed'],
        ['Resolved', 'Closed'],
        ['Closed', 'Reopened']
      ],
      'Client' => [
        ['New', 'Closed'],
        ['Resolved', 'Reopened'],
        ['Resolved', 'Closed']
      ]
    }.freeze

    PERMISSION_CANDIDATES = {
      select_project_modules: [:select_project_modules],
      save_queries: [:save_queries],
      view_messages: [:view_messages],
      post_messages: [:add_messages],
      edit_own_messages: [:edit_own_messages, :edit_messages],
      delete_own_messages: [:delete_own_messages, :delete_messages],
      add_message_watchers: [:add_message_watchers],
      delete_message_watchers: [:delete_message_watchers],
      view_calendar: [:view_calendar],
      view_documents: [:view_documents],
      add_documents: [:add_documents, :manage_documents],
      edit_documents: [:edit_documents, :manage_documents],
      delete_documents: [:delete_documents, :manage_documents],
      view_files: [:view_files],
      manage_files: [:manage_files],
      view_gantt_chart: [:view_gantt],
      flux_gantt: [:redmineflux_gantt],
      view_global_gantt: [:view_global_gantt],
      view_issues: [:view_issues],
      add_issues: [:add_issues],
      edit_issues: [:edit_issues],
      edit_own_issues: [:edit_own_issues],
      copy_issues: [:copy_issues],
      manage_issue_relations: [:manage_issue_relations],
      manage_subtasks: [:manage_subtasks],
      add_notes: [:add_issue_notes],
      edit_notes: [:edit_issue_notes],
      edit_own_notes: [:edit_own_issue_notes, :edit_own_notes],
      set_notes_private: [:set_notes_private],
      view_private_notes: [:view_private_notes],
      view_watchers: [:view_issue_watchers],
      add_watchers: [:add_issue_watchers],
      delete_watchers: [:delete_issue_watchers],
      import_issues: [:import_issues],
      manage_issue_categories: [:manage_issue_categories, :manage_categories],
      set_issues_private: [:set_issues_private],
      set_own_issues_private: [:set_own_issues_private],
      view_news: [:view_news],
      comment_news: [:comment_news],
      view_changesets: [:view_changesets],
      browse_repository: [:browse_repository],
      commit_access: [:commit_access],
      manage_related_issues: [:manage_related_issues],
      manage_repository: [:manage_repository],
      view_spent_time: [:view_time_entries],
      log_spent_time: [:log_time],
      edit_own_time_logs: [:edit_own_time_entries],
      edit_time_logs: [:edit_time_entries],
      manage_project_activities: [:manage_project_activities],
      log_spent_time_for_other_users: [:log_time_for_other_users],
      import_time_entries: [:import_time_entries],
      view_wiki: [:view_wiki_pages],
      view_wiki_history: [:view_wiki_edits],
      export_wiki: [:export_wiki_pages],
      edit_wiki: [:edit_wiki_pages],
      rename_wiki: [:rename_wiki_pages],
      delete_wiki: [:delete_wiki_pages],
      delete_wiki_attachments: [:delete_wiki_pages_attachments],
      protect_wiki: [:protect_wiki_pages],
      manage_wiki: [:manage_wiki],
      view_wiki_watchers: [:view_wiki_page_watchers],
      add_wiki_watchers: [:add_wiki_page_watchers],
      delete_wiki_watchers: [:delete_wiki_page_watchers],
      delete_project: [:delete_project]
    }.freeze

    QA_PERMISSION_KEYS = [
      :select_project_modules,
      :save_queries,
      :view_messages,
      :post_messages,
      :edit_own_messages,
      :delete_own_messages,
      :add_message_watchers,
      :delete_message_watchers,
      :view_calendar,
      :view_documents,
      :add_documents,
      :edit_documents,
      :view_files,
      :manage_files,
      :view_gantt_chart,
      :flux_gantt,
      :view_issues,
      :add_issues,
      :edit_issues,
      :edit_own_issues,
      :copy_issues,
      :manage_issue_relations,
      :manage_subtasks,
      :add_notes,
      :edit_notes,
      :edit_own_notes,
      :set_notes_private,
      :view_private_notes,
      :view_watchers,
      :add_watchers,
      :delete_watchers,
      :import_issues,
      :manage_issue_categories,
      :view_news,
      :comment_news,
      :view_changesets,
      :browse_repository,
      :view_spent_time,
      :log_spent_time,
      :edit_own_time_logs,
      :view_wiki,
      :view_wiki_history,
      :export_wiki,
      :edit_wiki,
      :view_wiki_watchers,
      :add_wiki_watchers,
      :delete_wiki_watchers
    ].freeze

    DEVELOPER_PERMISSION_KEYS = [
      :select_project_modules,
      :save_queries,
      :view_messages,
      :post_messages,
      :edit_own_messages,
      :view_calendar,
      :view_documents,
      :add_documents,
      :edit_documents,
      :view_files,
      :manage_files,
      :view_gantt_chart,
      :flux_gantt,
      :view_issues,
      :add_issues,
      :edit_issues,
      :edit_own_issues,
      :copy_issues,
      :manage_issue_relations,
      :manage_subtasks,
      :add_notes,
      :edit_notes,
      :edit_own_notes,
      :set_notes_private,
      :view_watchers,
      :add_watchers,
      :delete_watchers,
      :view_news,
      :comment_news,
      :view_changesets,
      :browse_repository,
      :commit_access,
      :manage_related_issues,
      :view_spent_time,
      :log_spent_time,
      :edit_own_time_logs,
      :view_wiki,
      :view_wiki_history,
      :export_wiki,
      :edit_wiki
    ].freeze

    CLIENT_PERMISSION_KEYS = [
      :save_queries,
      :view_messages,
      :post_messages,
      :view_calendar,
      :view_documents,
      :view_files,
      :view_gantt_chart,
      :flux_gantt,
      :view_issues,
      :add_issues,
      :add_notes,
      :view_watchers,
      :add_watchers,
      :view_news,
      :comment_news,
      :browse_repository,
      :view_spent_time,
      :view_wiki,
      :export_wiki
    ].freeze

    MANAGER_BLOCKED_KEYS = [:delete_project, :manage_repository].freeze

    def initialize(io = $stdout)
      @io = io
      @log_lines = []
      @critical_failures = []
      @bug_reports = {}
      @report = build_empty_report
      @statuses_by_name = {}
      @priorities_by_name = {}
      @trackers_by_name = {}
      @roles_by_name = {}
      @users_by_login = {}
      @projects_by_identifier = {}
      @versions_by_project = {}
      @categories_by_project = {}
      @pending_category_assignees = []
      @permission_name_set = Set.new
      @run_id = Time.now.utc.strftime('%Y-%m-%dT%H-%M-%S')
      srand(20_260_515)
    end

    def run!
      @started_at = Time.now
      log("Starting Redmine QA seed run: #{@run_id}")

      begin
        execute_step(1, 'API Settings', critical: true) { configure_api_settings }
        execute_step(2, 'Activities', critical: true) { configure_activities }
        execute_step(3, 'Issue Statuses', critical: true) { configure_statuses }
        execute_step(4, 'Priorities', critical: true) { configure_priorities }
        execute_step(5, 'Trackers', critical: true) { configure_trackers }
        execute_step(6, 'Roles', critical: true) { configure_roles }
        execute_step(7, 'Role Permissions', critical: true) { configure_role_permissions }
        execute_step(8, 'Workflow', critical: true) { configure_workflow }
        execute_step(9, 'Users', critical: true) { configure_users }
        execute_step(10, 'Projects', critical: true) { configure_projects }
        execute_step(11, 'Modules', critical: true) { configure_modules }
        execute_step(12, 'Versions', critical: true) { configure_versions }
        execute_step(13, 'Categories', critical: true) { configure_categories }
        execute_step(14, 'Members', critical: true) { configure_members }
        execute_step(15, 'Issues', critical: true) { configure_issues }
      rescue QaSeedCriticalError
        log('Critical failure reached. Remaining setup steps were not executed.')
      end

      execute_step(16, 'Validation', critical: false) { run_validation }
      execute_step(17, 'Final Report', critical: false) { nil }
      finalize_reports
    end

    private

    def build_empty_report
      {
        activities: { existing: [], created: [], failed: [] },
        statuses: { existing: [], created: [], failed: [] },
        priorities: { existing: [], created: [], failed: [] },
        trackers: { existing: [], created: [], failed: [] },
        roles: { existing: [], created: [], failed: [] },
        permissions: { configured: [], failed: [] },
        workflow: { added: [], existing: [], failed: [] },
        users: { created: [], existing: [], failed: [] },
        projects: { created: [], existing: [], failed: [] },
        versions: { created: [], existing: [], failed: [] },
        categories: { created: [], existing: [], failed: [] },
        members: { assigned: [], existing: [], failed: [] },
        issues: {
          total_created: 0,
          created_per_project: Hash.new(0),
          per_tracker: Hash.new(0),
          per_status: Hash.new(0),
          per_assignee: Hash.new(0),
          failed: []
        },
        validation: { passed: [], failed: [] }
      }
    end

    def execute_step(number, label, critical:)
      log("Step #{number}: #{label}")
      yield
      log("Step #{number}: #{label} completed")
    rescue StandardError => e
      register_bug_report("Step #{number} - #{label}", e)
      message = "Step #{number} failed: #{e.class} - #{e.message}"
      log(message)
      if critical
        @critical_failures << message
        raise QaSeedCriticalError, message
      end
    end

    def configure_api_settings
      set_setting('rest_api_enabled', '1')
      set_setting('jsonp_enabled', '1')
      unless Setting['rest_api_enabled'].to_s == '1' && Setting['jsonp_enabled'].to_s == '1'
        raise 'REST API/JSONP settings did not persist after save/refresh verification'
      end
    end

    def configure_activities
      REQUIRED_ACTIVITIES.each do |name|
        existing = time_entry_activity_by_name(name)
        if existing
          @report[:activities][:existing] << name
          next
        end
        created = TimeEntryActivity.new(name: name, active: true)
        save_or_raise!(created, "Activity '#{name}'")
        @report[:activities][:created] << name
      end
      check_duplicates(TimeEntryActivity, REQUIRED_ACTIVITIES, :activities)
    end

    def configure_statuses
      REQUIRED_STATUSES.each do |status_def|
        name = status_def[:name]
        status = issue_status_by_name(name)
        if status
          @report[:statuses][:existing] << name
        else
          status = IssueStatus.new(name: name)
          @report[:statuses][:created] << name
        end

        status.is_default = status_def[:is_default] if status.respond_to?(:is_default=)
        status.is_closed = status_def[:is_closed] if status.respond_to?(:is_closed=)
        save_or_raise!(status, "Issue status '#{name}'")
        @statuses_by_name[name] = status
      end

      new_status = issue_status_by_name('New')
      raise "Default status 'New' not found" unless new_status
      IssueStatus.where.not(id: new_status.id).update_all(is_default: false) if IssueStatus.column_names.include?('is_default')
      new_status.update!(is_default: true) if new_status.respond_to?(:is_default=)

      closed_status = issue_status_by_name('Closed')
      raise "Closed status 'Closed' not found" unless closed_status
      closed_status.update!(is_closed: true) if closed_status.respond_to?(:is_closed=)

      check_duplicates(IssueStatus, REQUIRED_STATUSES.map { |s| s[:name] }, :statuses)
    end

    def configure_priorities
      REQUIRED_PRIORITIES.each do |name|
        existing = issue_priority_by_name(name)
        if existing
          @report[:priorities][:existing] << name
        else
          created = IssuePriority.new(name: name, active: true)
          save_or_raise!(created, "Issue priority '#{name}'")
          @report[:priorities][:created] << name
          existing = created
        end
        @priorities_by_name[name] = existing
      end
      check_duplicates(IssuePriority, REQUIRED_PRIORITIES, :priorities)
    end

    def configure_trackers
      default_status = default_issue_status
      raise 'Cannot configure trackers because no issue status exists' unless default_status

      REQUIRED_TRACKERS.each do |name|
        tracker = tracker_by_name(name)
        if tracker
          @report[:trackers][:existing] << name
        else
          tracker = Tracker.new(name: name)
          tracker.default_status = default_status if tracker.respond_to?(:default_status=)
          tracker.is_in_roadmap = true if tracker.respond_to?(:is_in_roadmap=)
          save_or_raise!(tracker, "Tracker '#{name}'")
          @report[:trackers][:created] << name
        end
        @trackers_by_name[name] = tracker
      end
      check_duplicates(Tracker, REQUIRED_TRACKERS, :trackers)
    end

    def configure_roles
      REQUIRED_ROLES.each do |name|
        role = role_by_name(name)
        if role
          @report[:roles][:existing] << name
        else
          role = Role.new(name: name)
          save_or_raise!(role, "Role '#{name}'")
          @report[:roles][:created] << name
        end
        @roles_by_name[name] = role
      end
    end

    def configure_role_permissions
      @permission_name_set = Set.new(Redmine::AccessControl.permissions.map { |p| p.name.to_sym })

      apply_role_permissions('QA Engineer', QA_PERMISSION_KEYS)
      apply_role_permissions('Developer', DEVELOPER_PERMISSION_KEYS)
      apply_role_permissions('Client', CLIENT_PERMISSION_KEYS)
      apply_manager_permissions
    end

    def configure_workflow
      required_status_names = REQUIRED_STATUSES.map { |s| s[:name] }
      required_status_ids = required_status_names.map { |name| issue_status_by_name(name)&.id }.compact
      raise 'Required statuses not fully available for workflow' unless required_status_ids.size == required_status_names.size

      WORKFLOW_RULES.each do |role_name, transitions|
        role = role_by_name(role_name)
        raise "Role '#{role_name}' not found for workflow" unless role

        REQUIRED_TRACKERS.each do |tracker_name|
          tracker = tracker_by_name(tracker_name)
          raise "Tracker '#{tracker_name}' not found for workflow" unless tracker

          desired_pairs = transitions.map { |from, to| [issue_status_by_name(from).id, issue_status_by_name(to).id] }.to_set
          existing_scope = WorkflowTransition.where(role_id: role.id, tracker_id: tracker.id)
          existing_scope = existing_scope.where(old_status_id: required_status_ids, new_status_id: required_status_ids)

          existing_map = {}
          existing_scope.each do |transition|
            existing_map[[transition.old_status_id, transition.new_status_id]] = transition
          end

          desired_pairs.each do |pair|
            if existing_map[pair]
              @report[:workflow][:existing] << "#{role_name} / #{tracker_name}: #{status_name_from_id(pair[0])} -> #{status_name_from_id(pair[1])}"
              next
            end

            attrs = {
              role_id: role.id,
              tracker_id: tracker.id,
              old_status_id: pair[0],
              new_status_id: pair[1]
            }
            attrs[:author] = false if WorkflowTransition.column_names.include?('author')
            attrs[:assignee] = false if WorkflowTransition.column_names.include?('assignee')
            created = WorkflowTransition.new(attrs)
            save_or_raise!(created, "Workflow transition #{role_name}/#{tracker_name}/#{pair.inspect}")
            @report[:workflow][:added] << "#{role_name} / #{tracker_name}: #{status_name_from_id(pair[0])} -> #{status_name_from_id(pair[1])}"
          end

          existing_scope.each do |transition|
            pair = [transition.old_status_id, transition.new_status_id]
            next if desired_pairs.include?(pair)
            transition.destroy
          end
        end
      end
    end

    def configure_users
      REQUIRED_USERS.each do |user_def|
        login = user_def[:login]
        user = User.find_by(login: login)
        is_existing = !user.nil?

        user ||= User.new(login: login)
        user.firstname = user_def[:firstname]
        user.lastname = user_def[:lastname]
        user.language = 'en' if user.respond_to?(:language=)
        user.mail_notification = 'only_my_events' if user.respond_to?(:mail_notification=)
        existing_email = user_email_value(user)
        assign_user_email(user, existing_email.present? ? existing_email : unique_mail_for(login))
        user.password = user_def[:password]
        user.password_confirmation = user_def[:password]
        user.auth_source_id = nil if user.respond_to?(:auth_source_id=)
        user.must_change_passwd = false if user.respond_to?(:must_change_passwd=)
        user.status = User::STATUS_ACTIVE if user.respond_to?(:status=) && defined?(User::STATUS_ACTIVE)
        save_or_raise!(user, "User '#{login}'")

        if is_existing
          @report[:users][:existing] << login
        else
          @report[:users][:created] << login
        end

        if User.respond_to?(:try_to_login)
          authed = User.try_to_login(login, user_def[:password])
          raise "Login validation failed for user '#{login}'" unless authed
        end
        @users_by_login[login] = user
      end
    end

    def configure_projects
      REQUIRED_PROJECTS.each do |project_def|
        identifier = project_def[:identifier]
        project = Project.find_by(identifier: identifier)
        if project
          @report[:projects][:existing] << identifier
        else
          project = Project.new(
            name: project_def[:name],
            identifier: identifier,
            description: "QA seeded project for #{project_def[:name]}",
            is_public: true
          )
          save_or_raise!(project, "Project '#{identifier}'")
          @report[:projects][:created] << identifier
        end
        @projects_by_identifier[identifier] = project
      end
    end

    def configure_modules
      available_modules = Redmine::AccessControl.available_project_modules.map(&:to_s).to_set
      projects = selected_projects

      projects.each do |project|
        current_module_names = project.enabled_module_names.map(&:to_s).to_set
        modules_to_enable = []

        MODULE_CANDIDATES.each do |label, candidates|
          module_name = candidates.find { |name| available_modules.include?(name) }
          if module_name
            modules_to_enable << module_name
          else
            @report[:validation][:failed] << "Module '#{label}' is unavailable in this Redmine instance"
          end
        end

        project.enabled_module_names = (current_module_names.to_a + modules_to_enable).uniq

        required_trackers = REQUIRED_TRACKERS.map { |name| tracker_by_name(name) }.compact
        project.trackers = (project.trackers + required_trackers).uniq
        save_or_raise!(project, "Project modules/trackers for '#{project.identifier}'")
      end
    end

    def configure_versions
      selected_projects.each do |project|
        @versions_by_project[project.identifier] ||= {}
        REQUIRED_VERSIONS.each_with_index do |version_def, index|
          name = version_def[:name]
          version = project.versions.where('LOWER(name) = ?', name.downcase).first
          if version
            @report[:versions][:existing] << "#{project.identifier}:#{name}"
          else
            version = project.versions.new(name: name, description: version_def[:description])
            start_date, due_date = version_dates_for(index)
            version.start_date = start_date if version.respond_to?(:start_date=)
            version.effective_date = due_date if version.respond_to?(:effective_date=)
            save_or_raise!(version, "Version '#{name}' in project '#{project.identifier}'")
            @report[:versions][:created] << "#{project.identifier}:#{name}"
          end
          @versions_by_project[project.identifier][name] = version
        end
      end
    end

    def configure_categories
      selected_projects.each do |project|
        @categories_by_project[project.identifier] ||= {}
        REQUIRED_CATEGORIES.each do |category_def|
          category_name = category_def[:name]
          assignee = user_by_login(category_def[:assignee_login])
          raise "Assignee '#{category_def[:assignee_login]}' missing for category '#{category_name}'" unless assignee

          category = project.issue_categories.where('LOWER(name) = ?', category_name.downcase).first
          if category
            @report[:categories][:existing] << "#{project.identifier}:#{category_name}"
          else
            category = project.issue_categories.new(name: category_name)
            @report[:categories][:created] << "#{project.identifier}:#{category_name}"
          end

          if category.respond_to?(:assigned_to=)
            if project_member?(project, assignee)
              category.assigned_to = assignee
            else
              category.assigned_to = nil
              @pending_category_assignees << {
                project_identifier: project.identifier,
                category_name: category_name,
                assignee_login: assignee.login
              }
            end
          end

          save_or_raise!(category, "Category '#{category_name}' in project '#{project.identifier}'")
          @categories_by_project[project.identifier][category_name] = category
        end
      end
    end

    def configure_members
      selected_projects.each do |project|
        MEMBER_ASSIGNMENTS.each do |login, role_name|
          user = user_by_login(login)
          role = role_by_name(role_name)
          raise "Missing user '#{login}' for member assignment" unless user
          raise "Missing role '#{role_name}' for member assignment" unless role

          member = Member.find_or_initialize_by(project_id: project.id, user_id: user.id)
          existing_role_ids = member.persisted? ? member.member_roles.pluck(:role_id) : []
          if existing_role_ids.include?(role.id)
            @report[:members][:existing] << "#{project.identifier}:#{login}:#{role_name}"
            next
          end

          member.roles = (member.roles + [role]).uniq
          save_or_raise!(member, "Member '#{login}' in project '#{project.identifier}'")
          @report[:members][:assigned] << "#{project.identifier}:#{login}:#{role_name}"
        end
      end

      apply_pending_category_assignees
    end

    def configure_issues
      admin_user = User.where(admin: true).first || User.where(login: 'admin').first || user_by_login('rahul.sharma')
      raise 'No author user available for issue creation' unless admin_user

      selected_projects.each do |project|
        existing_seed_count = Issue.where(project_id: project.id).where('description LIKE ?', "%#{SEED_MARKER}%").count
        needed = ISSUE_TARGET_PER_PROJECT - existing_seed_count
        next if needed <= 0

        created_for_project = 0
        needed.times do |offset|
          index = existing_seed_count + offset + 1
          tracker_name = REQUIRED_TRACKERS[(index - 1) % REQUIRED_TRACKERS.length]
          status_name = REQUIRED_STATUSES[(index - 1) % REQUIRED_STATUSES.length][:name]
          priority_name = REQUIRED_PRIORITIES[(index - 1) % REQUIRED_PRIORITIES.length]
          tracker = tracker_by_name(tracker_name)
          status = issue_status_by_name(status_name)
          priority = issue_priority_by_name(priority_name)
          category = pick_category_for(project, tracker_name, index)
          version = pick_version_for(project, index)
          assignee = pick_assignee_for(project, tracker_name, index)
          start_date, due_date = build_issue_dates(index)
          estimated_hours = estimated_hours_for(index)
          done_ratio = done_ratio_for(status_name, index)
          subject = format('%s | %s | Seed #%03d', tracker_name, project.name, index)
          description = build_issue_description(project, tracker_name, index, status_name)

          issue = Issue.new(
            project: project,
            tracker: tracker,
            status: status,
            priority: priority,
            subject: subject,
            description: description,
            assigned_to: assignee,
            category: category,
            fixed_version: version,
            start_date: start_date,
            due_date: due_date,
            estimated_hours: estimated_hours,
            done_ratio: done_ratio,
            author: admin_user
          )

          save_or_raise!(issue, "Issue '#{subject}' in project '#{project.identifier}'")
          created_for_project += 1
          @report[:issues][:total_created] += 1
          @report[:issues][:created_per_project][project.name] += 1
          @report[:issues][:per_tracker][tracker_name] += 1
          @report[:issues][:per_status][status_name] += 1
          @report[:issues][:per_assignee][assignee.login] += 1
        rescue StandardError => e
          @report[:issues][:failed] << "#{project.identifier}:#{subject}: #{e.message}"
          register_bug_report("Issue creation - #{project.identifier} - #{subject}", e)
        end

        raise "Issue target not met for project '#{project.identifier}'" if created_for_project < needed
      end
    end

    def run_validation
      validate_named_records(TimeEntryActivity, REQUIRED_ACTIVITIES, 'Activities')
      validate_named_records(IssueStatus, REQUIRED_STATUSES.map { |x| x[:name] }, 'Statuses')
      validate_named_records(IssuePriority, REQUIRED_PRIORITIES, 'Priorities')
      validate_named_records(Tracker, REQUIRED_TRACKERS, 'Trackers')
      validate_named_records(Role, REQUIRED_ROLES, 'Roles')

      selected_projects.each do |project|
        project_issue_count = Issue.where(project_id: project.id).where('description LIKE ?', "%#{SEED_MARKER}%").count
        if project_issue_count >= ISSUE_TARGET_PER_PROJECT
          @report[:validation][:passed] << "Project #{project.identifier} issue target met (#{project_issue_count})"
        else
          @report[:validation][:failed] << "Project #{project.identifier} has only #{project_issue_count}/#{ISSUE_TARGET_PER_PROJECT} seeded issues"
        end
      end

      if issue_status_default_column
        new_statuses = IssueStatus.where(issue_status_default_column => true).pluck(:name)
        if new_statuses.size == 1 && new_statuses.first.casecmp('new').zero?
          @report[:validation][:passed] << 'Only one default status exists and it is New'
        else
          @report[:validation][:failed] << "Default status validation failed: #{new_statuses.join(', ')}"
        end
      else
        new_status = issue_status_by_name('New')
        if new_status
          @report[:validation][:passed] << "Default status column is unavailable; using 'New' presence as fallback"
        else
          @report[:validation][:failed] << "Default status column is unavailable and status 'New' is missing"
        end
      end

      closed_status = issue_status_by_name('Closed')
      if closed_status && (!closed_status.respond_to?(:is_closed) || closed_status.is_closed)
        @report[:validation][:passed] << 'Closed status is configured as closed'
      else
        @report[:validation][:failed] << 'Closed status is not configured as closed'
      end
    end

    def finalize_reports
      final_status = if @critical_failures.any? || @report[:validation][:failed].any? || @report[:issues][:failed].any?
                       'NEEDS ATTENTION'
                     else
                       'TEST DATA READY'
                     end

      report_dir = report_directory
      FileUtils.mkdir_p(report_dir)
      log_path = File.join(report_dir, "execution-log-#{@run_id}.md")
      report_path = File.join(report_dir, "final-report-#{@run_id}.md")

      File.write(log_path, build_execution_log_body(final_status))
      File.write(report_path, build_final_report_body(final_status))

      log("Execution log: #{log_path}")
      log("Final report: #{report_path}")
      log("Final status: #{final_status}")
    end

    def build_execution_log_body(final_status)
      lines = []
      lines << "# Redmine QA Seed Execution Log"
      lines << ''
      lines << "- Run ID: `#{@run_id}`"
      lines << "- Started: `#{@started_at.utc.iso8601}`"
      lines << "- Finished: `#{Time.now.utc.iso8601}`"
      lines << "- Final Status: `#{final_status}`"
      lines << ''
      lines << '## Timeline'
      lines << ''
      @log_lines.each { |entry| lines << "- #{entry}" }
      lines << ''
      lines << '## Bug Reports'
      lines << ''
      if @bug_reports.empty?
        lines << '- None'
      else
        @bug_reports.each_value do |payload|
          lines << "- `#{payload[:step]}`: #{payload[:message]}"
        end
      end
      lines.join("\n")
    end

    def build_final_report_body(final_status)
      lines = []
      lines << "# Redmine QA Final Report"
      lines << ''
      lines << "- Run ID: `#{@run_id}`"
      lines << "- Final Status: `#{final_status}`"
      lines << ''

      append_section(lines, 'Activities', @report[:activities])
      append_section(lines, 'Statuses', @report[:statuses])
      append_section(lines, 'Priorities', @report[:priorities])
      append_section(lines, 'Trackers', @report[:trackers])
      append_section(lines, 'Roles', @report[:roles])
      append_section(lines, 'Permissions', @report[:permissions])
      append_section(lines, 'Workflow', @report[:workflow])
      append_section(lines, 'Users', @report[:users])
      append_section(lines, 'Projects', @report[:projects])
      append_section(lines, 'Versions', @report[:versions])
      append_section(lines, 'Categories', @report[:categories])
      append_section(lines, 'Members', @report[:members])

      lines << '## Issues'
      lines << ''
      lines << "- Total issues created: `#{@report[:issues][:total_created]}`"
      lines << "- Issues created per project: `#{stringify_hash(@report[:issues][:created_per_project])}`"
      lines << "- Issues per tracker: `#{stringify_hash(@report[:issues][:per_tracker])}`"
      lines << "- Issues per status: `#{stringify_hash(@report[:issues][:per_status])}`"
      lines << "- Issues per assignee: `#{stringify_hash(@report[:issues][:per_assignee])}`"
      lines << "- Failed issues: `#{safe_list(@report[:issues][:failed])}`"
      lines << ''

      append_section(lines, 'Validation', @report[:validation])
      lines << '## Final Status'
      lines << ''
      lines << "- #{final_status}"
      lines.join("\n")
    end

    def append_section(lines, title, bucket)
      lines << "## #{title}"
      lines << ''
      bucket.each do |key, value|
        lines << "- #{key.to_s.tr('_', ' ')}: `#{safe_list(value)}`"
      end
      lines << ''
    end

    def safe_list(value)
      case value
      when Hash
        stringify_hash(value)
      when Array
        value.empty? ? 'None' : value.join(' | ')
      else
        value.to_s
      end
    end

    def stringify_hash(hash)
      return 'None' if hash.nil? || hash.empty?
      hash.map { |k, v| "#{k}=#{v}" }.join(', ')
    end

    def report_directory
      if defined?(Rails) && Rails.respond_to?(:root)
        Rails.root.join('plugins', 'redmineflux_gantt_plugin', 'tmp', 'qa_seed_reports').to_s
      else
        File.expand_path('../../tmp/qa_seed_reports', __dir__)
      end
    end

    def apply_role_permissions(role_name, permission_keys)
      role = role_by_name(role_name)
      raise "Role '#{role_name}' not found while configuring permissions" unless role

      permissions, unresolved = resolve_permission_keys(permission_keys)
      role.permissions = permissions
      save_or_raise!(role, "Permissions for role '#{role_name}'")

      if unresolved.empty?
        @report[:permissions][:configured] << role_name
      else
        @report[:permissions][:failed] << "#{role_name}: unresolved #{unresolved.join(', ')}"
      end
    end

    def apply_manager_permissions
      role = role_by_name('Manager')
      raise "Role 'Manager' not found while configuring permissions" unless role

      blocked_permissions, unresolved = resolve_permission_keys(MANAGER_BLOCKED_KEYS)
      all_permissions = @permission_name_set.to_a
      role.permissions = (all_permissions - blocked_permissions).sort
      save_or_raise!(role, "Permissions for role 'Manager'")

      if unresolved.empty?
        @report[:permissions][:configured] << 'Manager'
      else
        @report[:permissions][:failed] << "Manager: unresolved blocklist #{unresolved.join(', ')}"
      end
    end

    def resolve_permission_keys(keys)
      resolved = []
      unresolved = []
      keys.each do |key|
        candidates = PERMISSION_CANDIDATES.fetch(key) { [] }
        permission = candidates.find { |candidate| @permission_name_set.include?(candidate.to_sym) }
        if permission
          resolved << permission.to_sym
        else
          unresolved << key
        end
      end
      [resolved.uniq.sort, unresolved]
    end

    def set_setting(key, value)
      Setting[key] = value
      raise "Setting '#{key}' did not persist" unless Setting[key].to_s == value.to_s
    end

    def selected_projects
      REQUIRED_PROJECTS.map { |project| project_by_identifier(project[:identifier]) }.compact
    end

    def time_entry_activity_by_name(name)
      TimeEntryActivity.where('LOWER(name) = ?', name.downcase).first
    end

    def issue_status_by_name(name)
      @statuses_by_name[name] || IssueStatus.where('LOWER(name) = ?', name.downcase).first
    end

    def issue_priority_by_name(name)
      @priorities_by_name[name] || IssuePriority.where('LOWER(name) = ?', name.downcase).first
    end

    def tracker_by_name(name)
      @trackers_by_name[name] || Tracker.where('LOWER(name) = ?', name.downcase).first
    end

    def role_by_name(name)
      @roles_by_name[name] || Role.where('LOWER(name) = ?', name.downcase).first
    end

    def user_by_login(login)
      @users_by_login[login] || User.find_by(login: login)
    end

    def user_email_column
      @user_email_column ||= begin
        if User.column_names.include?('mail')
          'mail'
        elsif User.column_names.include?('email')
          'email'
        else
          nil
        end
      end
    end

    def user_email_value(user)
      if user.respond_to?(:mail)
        mail_value = user.mail
        return mail_value if mail_value.present?
      end

      if user.respond_to?(:email)
        email_value = user.email
        return email_value if email_value.present?
      end

      column = user_email_column
      return nil unless column
      user.read_attribute(column)
    end

    def assign_user_email(user, value)
      assigned = false

      if user.respond_to?(:mail=)
        begin
          user.mail = value
          assigned = true
        rescue StandardError
          # Fall back to other assignment strategies.
        end
      end

      unless assigned
        if user.respond_to?(:email=)
          begin
            user.email = value
            assigned = true
          rescue StandardError
            # Fall back to attribute write.
          end
        end
      end

      column = user_email_column
      return if assigned || !column
      user.write_attribute(column, value)
    end

    def user_email_exists?(value)
      column = user_email_column
      return User.where(column => value).exists? if column

      if defined?(EmailAddress)
        email_column =
          if EmailAddress.column_names.include?('address')
            'address'
          elsif EmailAddress.column_names.include?('mail')
            'mail'
          elsif EmailAddress.column_names.include?('email')
            'email'
          end
        return EmailAddress.where(email_column => value).exists? if email_column
      end

      false
    end

    def issue_status_default_column
      @issue_status_default_column ||= begin
        if IssueStatus.column_names.include?('is_default')
          'is_default'
        elsif IssueStatus.column_names.include?('default')
          'default'
        else
          nil
        end
      end
    end

    def default_issue_status
      return issue_status_by_name('New') || IssueStatus.first unless issue_status_default_column
      IssueStatus.where(issue_status_default_column => true).first || issue_status_by_name('New') || IssueStatus.first
    end

    def project_by_identifier(identifier)
      @projects_by_identifier[identifier] || Project.find_by(identifier: identifier)
    end

    def project_member?(project, user)
      Member.where(project_id: project.id, user_id: user.id).exists?
    end

    def apply_pending_category_assignees
      return if @pending_category_assignees.empty?

      @pending_category_assignees.each do |pending|
        project = project_by_identifier(pending[:project_identifier])
        assignee = user_by_login(pending[:assignee_login])
        next unless project && assignee && project_member?(project, assignee)

        category = project.issue_categories.where('LOWER(name) = ?', pending[:category_name].downcase).first
        next unless category && category.respond_to?(:assigned_to=)

        category.assigned_to = assignee
        save_or_raise!(category, "Deferred category assignee '#{pending[:category_name]}' in '#{project.identifier}'")
      end
    end

    def pick_category_for(project, tracker_name, index)
      allowed = TRACKER_CATEGORY_RULES.fetch(tracker_name)
      category_name = allowed[(index - 1) % allowed.length]
      @categories_by_project.fetch(project.identifier).fetch(category_name)
    end

    def pick_version_for(project, index)
      versions = @versions_by_project.fetch(project.identifier).values
      versions[(index - 1) % versions.length]
    end

    def pick_assignee_for(project, tracker_name, index)
      logins = case tracker_name
               when 'Support'
                 %w[rahul.sharma sneha.kapoor priya.patel neha.joshi aman.verma rohit.mehta]
               when 'Test Case'
                 %w[priya.patel neha.joshi aman.verma rohit.mehta]
               else
                 %w[aman.verma rohit.mehta priya.patel neha.joshi rahul.sharma sneha.kapoor]
               end

      assignee = user_by_login(logins[(index - 1) % logins.length])
      member_scope = Member.where(project_id: project.id, user_id: assignee.id)
      return assignee if member_scope.exists?
      raise "Assignee '#{assignee.login}' is not a member of project '#{project.identifier}'"
    end

    def build_issue_dates(index)
      today = Date.current
      month_offsets = [-1, 0, 1]
      month = month_offsets[(index - 1) % month_offsets.length]
      month_date = today >> month
      day = ((index * 3) % 25) + 1
      start_date = Date.new(month_date.year, month_date.month, [day, Time.days_in_month(month_date.month, month_date.year)].min)

      duration_days = case index % 3
                      when 0 then 0
                      when 1 then 2 + (index % 4)
                      else 7 + (index % 8)
                      end
      due_date = start_date + duration_days
      [start_date, due_date]
    end

    def version_dates_for(index)
      # Stable release windows so version validations pass consistently.
      # v1.0.0 < v1.1.0 < v2.0.0 < Hotfix Release
      base = Date.current.beginning_of_month
      start_date = base - 45.days + (index * 40).days
      due_date = start_date + 30.days
      [start_date, due_date]
    end

    def estimated_hours_for(index)
      case index % 3
      when 0 then 1 + (index % 4)
      when 1 then 5 + (index % 12)
      else 17 + (index % 24)
      end
    end

    def done_ratio_for(status_name, index)
      case status_name
      when 'New' then [0, 10].sample
      when 'In Progress' then 20 + (index % 50)
      when 'QA' then 70 + (index % 20)
      when 'Resolved' then 90 + (index % 10)
      when 'Reopened' then 40 + (index % 40)
      when 'Closed' then 100
      else 0
      end
    end

    def build_issue_description(project, tracker_name, index, status_name)
      <<~TEXT.strip
        #{SEED_MARKER}
        Project: #{project.name}
        Tracker: #{tracker_name}
        Sequence: #{index}
        Status: #{status_name}
        This is an auto-generated QA seed issue for deterministic test data setup.
      TEXT
    end

    def unique_mail_for(login)
      base = "#{login}@redmineflux.local"
      return base unless user_email_exists?(base)

      suffix = 1
      loop do
        candidate = "#{login}+#{suffix}@redmineflux.local"
        return candidate unless user_email_exists?(candidate)
        suffix += 1
        return "#{login}+#{Time.now.to_i}@redmineflux.local" if suffix > 10_000
      end
    end

    def status_name_from_id(status_id)
      status = IssueStatus.find_by(id: status_id)
      status ? status.name : status_id.to_s
    end

    def validate_named_records(model, required_names, label)
      missing = required_names.reject do |name|
        model.where('LOWER(name) = ?', name.downcase).exists?
      end
      if missing.empty?
        @report[:validation][:passed] << "#{label} present"
      else
        @report[:validation][:failed] << "#{label} missing: #{missing.join(', ')}"
      end

      duplicate_names = required_names.select do |name|
        model.where('LOWER(name) = ?', name.downcase).count > 1
      end
      return if duplicate_names.empty?
      @report[:validation][:failed] << "#{label} duplicates: #{duplicate_names.join(', ')}"
    end

    def check_duplicates(model, names, report_bucket)
      duplicates = names.select do |name|
        model.where('LOWER(name) = ?', name.downcase).count > 1
      end
      return if duplicates.empty?
      @report[report_bucket][:failed] << "Duplicates found: #{duplicates.join(', ')}"
    end

    def save_or_raise!(record, context)
      return if record.save
      raise "#{context} save failed: #{record.errors.full_messages.join(', ')}"
    end

    def register_bug_report(step, error)
      fingerprint = "#{step}|#{error.class}|#{error.message}"
      return if @bug_reports.key?(fingerprint)
      @bug_reports[fingerprint] = { step: step, message: error.message, class: error.class.name }
    end

    def log(message)
      stamp = Time.now.strftime('%Y-%m-%d %H:%M:%S')
      line = "[#{stamp}] #{message}"
      @io.puts(line)
      @log_lines << line
    end
  end
end

namespace :redmineflux_gantt_plugin do
  desc 'Seed full Redmine QA test data/configuration in strict dependency order'
  task seed_qa_data: :environment do
    RedminefluxGanttPlugin::QaSeedRunner.new.run!
  end
end
