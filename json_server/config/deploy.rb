#$:.unshift(File.expand_path('./lib', ENV['rvm_path'])) # Add RVM's lib directory to the load path.
#require "rvm/capistrano"                  # Load RVM's capistrano plugin.
#set :rvm_ruby_string, 'ree@mood_chart'        # Or whatever env you want it to run in.

require 'bundler/capistrano'

set :application, "politimap"

set :repository,  "git@github.com:alx/politimap.git"
set :scm, :git

set :ssh_options, { :forward_agent => true, :port => 22104 }

set :user, "alex"
set :group, "alex"
set :deploy_to, "/home/alex/#{application}"

set :domain, "88.191.126.74"
server domain, :app, :web
role :db, domain, :primary => true

default_run_options[:pty] = true

# if you're still using the script/reaper helper you will need
# these http://github.com/rails/irs_process_scripts

# If you are using Passenger mod_rails uncomment this:
namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "touch #{File.join(current_path,'tmp','restart.txt')}"
  end
end

task :link_shared_directories do     
end    

after "deploy:update_code", :link_shared_directories

