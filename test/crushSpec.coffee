crush = require '..'
fs = require 'fs'


preTags = /<pre[\s\S]+<\/pre>/g
testPage = fs.readFileSync("#{__dirname}/src/index.html", 'utf8')

describe 'crushomatic', ->
	
	
	it 'should exist', ->
		expect(crush).toBeDefined()
	
	
	it 'should remove newlines from an HTML file', ->
		asyncSpecWait()
		
		crush.file "#{__dirname}/src/index.html", (err, results) ->
			
			expect(err).toBeNull()
			
			results = results.replace(preTags, '')
			expect(results.split(/\r?\n/).length).toBe(1)
			
			asyncSpecDone()
	
	
	it 'should remove extra whitespace from an HTML file', ->
		asyncSpecWait()
		
		whitespace = /\t| {2}/
		
		crush.file "#{__dirname}/src/index.html", (err, results) ->
			
			expect(err).toBeNull()
			results = results.replace(preTags, '')
			expect(whitespace.test(results)).toBe(false)
			
			asyncSpecDone()
	
	
	it 'should not touch whitespace in pre tags', ->
		asyncSpecWait()
		
		crush.file "#{__dirname}/src/index.html", (err, results) ->
			
			matches = testPage.match(preTags)
			
			expect(err).toBeNull()
			expect(matches).toEqual(results.match(preTags), 'matches')
			
			expect(/^<!DOCTYPE/.test(results)).toBe(true, 'starts well')
			expect(/<\/html>$/.test(results)).toBe(true, 'ends well')
			
			asyncSpecDone()
	
	
	it 'should inline and compress css', ->
		asyncSpecWait()
		
		crush.file "#{__dirname}/src/index.html", (err, results) ->
			styles = /<style.*<\/style>/g;
			links = /<link[^>]*rel="stylesheet"[^>]*>/g
			
			expect(err).toBeNull()
			expect(links.test(results)).toBe(false, 'Link stylesheet elements still exist')
			
			expect(results.match(styles).length).toBe(1, 'There is more than one style element')
			
			asyncSpecDone()
	
	